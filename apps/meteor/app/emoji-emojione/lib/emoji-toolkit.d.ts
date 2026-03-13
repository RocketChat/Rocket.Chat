declare module 'emoji-toolkit' {
  interface EmojiData {
    uc_base: string;
    uc_full: string;
    shortnames: string[];
    category: string;
  }

  interface EmojiToolkit {
    emojiList: Record<string, EmojiData>;
    asciiList: Record<string, string>;
    asciiRegexp: string;
    emojiVersion: string;
    emojiSize: string;
    imagePathPNG: string;
    defaultPathPNG: string;
    fileExtension: string;
    imageTitleTag: boolean;
    sprites: boolean;
    unicodeAlt: boolean;
    ascii: boolean;
    riskyMatchAscii: boolean;
    regAscii: RegExp;
    regAsciiRisky: RegExp;
    shortnames: string;
    regShortNames: RegExp;
    shortnameLookup: Record<string, string>;
    altShortNames: Record<string, string>;
    unicodeCharRegexCached: Record<string, RegExp>;

    convert(unicode: string): string;
    toImage(shortname: string): string;
    toShort(shortname: string): string;
    unifyUnicode(str: string): string;
    shortnameToAscii(str: string): string;
    shortnameToUnicode(str: string): string;
    shortnameToImage(str: string): string;
    unescapeHTML(str: string): string;
    escapeHTML(str: string): string;
    replace_colons(str: string): string;
    replace_emoticons(str: string): string;
    replace_unified(str: string): string;
    unicodeCharRegex(): RegExp;
    mapEmojiList(callback: (unicode: string, shortname: string) => void): void;
    mapUnicodeToShort(): Record<string, string>;
    memorizeReplacement(): void;
    mapUnicodeCharactersToShort(): Record<string, string>;
    objectFlip(obj: Record<string, any>): Record<string, string>;
    escapeRegExp(str: string): string;
    replaceAll(str: string, find: string): string;
    init(): void;
  }

  const emojiToolkit: EmojiToolkit;
  export = emojiToolkit;
}