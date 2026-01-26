/**
 * Capitalize the first letter of a string
 * @param str The input string
 */
export const capitalize = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert a string to a URL-friendly slug
 * @param str The input string
 */
export const slugify = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
