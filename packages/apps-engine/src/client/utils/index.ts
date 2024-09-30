/**
 * Generate a random string with the specified length.
 * @param length the length for the generated random string.
 */
export function randomString(length: number): string {
    const buffer: Array<string> = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        buffer.push(chars[getRandomInt(chars.length)]);
    }

    return buffer.join('');
}

function getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
}
