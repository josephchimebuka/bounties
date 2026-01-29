import { cookies } from "next/headers";

export interface User {
    id: string;
    name: string;
    email?: string;
}

export async function getCurrentUser(): Promise<User | null> {
    // In a real implementation, this would use the better-auth server instance:
    // const session = await auth.api.getSession({ headers: await headers() });
    // return session?.user;

    // For now, checks for the cookie used in proxy.ts as a weak signal, 
    // or returns a mock user in development.
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("boundless_auth.session_token") || cookieStore.get("boundless_auth");

    if (process.env.NODE_ENV === "development" || sessionCookie) {
        return {
            id: "mock-user-123",
            name: "Mock User",
            email: "mock@example.com"
        };
    }

    return null;
}
