/**
 * Wait for a specified amount of time.
 * 
 * @param ms - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified time.
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a promise-returning function a specified number of times.
 * 
 * @param fn - The function to retry.
 * @param retries - The number of times to retry.
 * @param delay - The delay between retries in milliseconds.
 * @returns The result of the function if it succeeds.
 */
export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) {
            throw error;
        }
        await sleep(delay);
        return retry(fn, retries - 1, delay);
    }
}
