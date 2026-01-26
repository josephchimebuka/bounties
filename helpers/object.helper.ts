/**
 * Pick properties from an object
 * @param obj The object source
 * @param keys The keys to pick
 * @returns A new object with only the picked keys
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}

/**
 * Omit properties from an object
 * @param obj The object source
 * @param keys The keys to omit
 * @returns A new object without the omitted keys
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach((key) => {
        delete result[key];
    });
    return result;
}
