import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { HttpLink } from "@apollo/client/link/http";
import { SetContextLink } from "@apollo/client/link/context";
import { ErrorLink } from "@apollo/client/link/error";
import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
} from "@apollo/client/errors";

// Re-export all error utilities from errors.ts for convenience
export {
  AppGraphQLError,
  ApiError,
  NetworkError,
  getErrorMessage,
  isAuthError,
  isAuthStatus,
  graphqlErrorResponseSchema,
  type GraphQLErrorResponse,
} from "./errors";

import { AppGraphQLError, NetworkError, isAuthStatus } from "./errors";

/**
 * Token Storage Strategy
 *
 * SECURITY CONSIDERATIONS:
 * - Access tokens are stored in-memory (runtime variable) to mitigate XSS attacks
 * - In-memory storage means tokens are lost on page refresh (more secure, less convenient)
 * - For session persistence across page reloads, the server should use httpOnly cookies
 *   for refresh tokens, allowing silent re-authentication via /api/auth/refresh endpoint
 *
 * RECOMMENDED ARCHITECTURE:
 * 1. Access Token: Short-lived (15min), stored in-memory only
 * 2. Refresh Token: Long-lived, stored in httpOnly cookie (server-set)
 * 3. On page load, call refresh endpoint to get new access token
 *
 * If you MUST use localStorage (e.g., for compatibility):
 * - Implement strict Content Security Policy (CSP)
 * - Sanitize all user inputs
 * - Use Subresource Integrity (SRI) for external scripts
 * - Consider using session storage instead (cleared on tab close)
 *
 * @see https://owasp.org/www-community/attacks/xss/
 */

// In-memory token storage (XSS-resistant, lost on page refresh)
let accessToken: string | null = null;

/**
 * Get access token from in-memory storage.
 * Returns null on server-side (SSR) or if no token is set.
 *
 * For session persistence across page reloads, implement a refresh token
 * flow using httpOnly cookies set by your authentication server.
 *
 * @returns The access token or null
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return accessToken;
}

/**
 * Set access token in in-memory storage.
 * Call this after successful authentication or token refresh.
 *
 * @param token - The access token to store
 */
export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  accessToken = token;
}

/**
 * Clear access token from in-memory storage.
 * Call this on logout or when token is invalidated.
 */
export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  accessToken = null;
}

/**
 * Check if user has an access token (is potentially authenticated).
 * Note: Token may be expired; server validation is still required.
 *
 * @returns true if an access token exists in memory
 */
export function hasAccessToken(): boolean {
  if (typeof window === "undefined") return false;
  return accessToken !== null;
}

/**
 * Apollo Client configuration options
 */
export interface ApolloClientOptions {
  /** GraphQL endpoint URL. Defaults to NEXT_PUBLIC_GRAPHQL_URL or '/api/graphql' */
  uri?: string;
  /** Whether to include credentials (cookies) in requests. Defaults to 'include' */
  credentials?: RequestCredentials;
  /** Whether running in SSR mode. Defaults to detecting typeof window */
  ssrMode?: boolean;
}

/**
 * Create HTTP link for GraphQL requests
 */
function createHttpLink(
  uri: string,
  credentials: RequestCredentials,
): HttpLink {
  return new HttpLink({
    uri,
    credentials,
  });
}

/**
 * Create auth link that attaches Bearer token to requests (only when token exists)
 */
function createAuthLink(): SetContextLink {
  return new SetContextLink((prevContext) => {
    const token = getAccessToken();
    const existingHeaders = prevContext.headers || {};

    return {
      headers: {
        ...existingHeaders,
        ...(token && { authorization: `Bearer ${token}` }),
      },
    };
  });
}

/**
 * Create error link that handles GraphQL and network errors.
 * - Converts GraphQL errors to AppGraphQLError instances
 * - Converts network errors to NetworkError instances
 * - Handles auth errors globally (401/403) by clearing token and dispatching event
 */
function createErrorLink(): ErrorLink {
  return new ErrorLink(({ error }) => {
    // Handle GraphQL errors
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach((graphQLError) => {
        const { message, locations, path, extensions } = graphQLError;
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        );

        // Convert to AppGraphQLError for consistent error handling
        const appError = AppGraphQLError.fromGraphQLError({
          message,
          extensions,
        });

        // Handle auth errors globally
        if (isAuthStatus(appError.status)) {
          clearAccessToken();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("auth:unauthorized", {
                detail: { status: appError.status },
              }),
            );
          }
        }
      });
    } else if (CombinedProtocolErrors.is(error)) {
      // Handle protocol errors (includes extensions with status codes)
      error.errors.forEach(({ message, extensions }) => {
        const code = extensions?.code as string | undefined;
        const status = (extensions?.status as number) || 500;

        console.error(
          `[Protocol error]: Message: ${message}, Code: ${code}, Extensions: ${JSON.stringify(extensions)}`,
        );

        // Handle auth errors globally using shared utility
        if (isAuthStatus(status)) {
          clearAccessToken();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("auth:unauthorized", { detail: { status } }),
            );
          }
        }
      });
    } else {
      // Handle network errors - convert to NetworkError
      console.error(`[Network error]: ${error}`);
      const networkError = new NetworkError(
        error instanceof Error ? error.message : String(error),
      );
      // Log the wrapped error for debugging
      console.error("[NetworkError wrapped]:", networkError);
    }
  });
}

/**
 * Create InMemoryCache with type policies for pagination
 */
function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configure pagination for bounties list
          bounties: {
            keyArgs: ["filter", "sort"],
            merge(existing, incoming, { args }) {
              if (!args?.pagination?.page || args.pagination.page === 1) {
                return incoming;
              }
              return {
                ...incoming,
                data: [...(existing?.data || []), ...(incoming?.data || [])],
              };
            },
          },
        },
      },
    },
  });
}

/**
 * Create a new Apollo Client instance.
 * Use this factory when you need a fresh client (e.g., for SSR or testing).
 *
 * @param options - Configuration options
 * @returns Configured ApolloClient instance
 */
export function createApolloClient(
  options: ApolloClientOptions = {},
): ApolloClient {
  const {
    uri = process.env.NEXT_PUBLIC_GRAPHQL_URL || "/api/graphql",
    credentials = "include",
    ssrMode = typeof window === "undefined",
  } = options;

  const httpLink = createHttpLink(uri, credentials);
  const authLink = createAuthLink();
  const errorLink = createErrorLink();

  return new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, httpLink]),
    cache: createCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
    ssrMode,
  });
}

// Singleton Apollo Client instance for client-side usage
let apolloClientInstance: ApolloClient | null = null;

/**
 * Get or create the Apollo Client singleton.
 * On the server, always creates a new client.
 * On the client, reuses the existing client instance.
 *
 * @param options - Configuration options (only used when creating new instance)
 * @returns Apollo Client instance
 */
export function getApolloClient(
  options: ApolloClientOptions = {},
): ApolloClient {
  // Server: always create a new client
  if (typeof window === "undefined") {
    return createApolloClient({ ...options, ssrMode: true });
  }

  // Client: reuse existing client or create new one
  if (!apolloClientInstance) {
    apolloClientInstance = createApolloClient({ ...options, ssrMode: false });
  }

  return apolloClientInstance;
}

/**
 * Default Apollo Client instance (singleton pattern for client-side).
 * For SSR, use createApolloClient() or getApolloClient() instead.
 */
export const apolloClient = getApolloClient();

/**
 * Helper to reset Apollo Client cache (useful after logout).
 * Clears all cached data from the client.
 */
export async function resetApolloClient(): Promise<void> {
  await apolloClient.clearStore();
}
