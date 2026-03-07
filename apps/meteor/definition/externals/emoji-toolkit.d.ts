declare module 'emoji-toolkit' {
    export function toShort(input: string): string;
    export function toImage(input: string): string;
    export function shortnameToUnicode(input: string): string;
    export function shortnameToImage(input: string): string;
    export function unicodeToImage(input: string): string;
    export function convert(input: string): string;
    export const emojiList: Record<string, any>;
}
