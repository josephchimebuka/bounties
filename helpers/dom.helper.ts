/**
 * Check if the code is running in the browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Copy text to clipboard
 * @param text The text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (!isBrowser) return;

    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy to clipboard', err);
        throw err;
    }
}
