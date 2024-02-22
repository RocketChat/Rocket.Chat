export type Blockquote = {
  type: 'BLOCKQUOTE';
  value: Paragraph[];
};

export type OrderedList = {
  type: 'ORDERED_LIST';
  value: ListItem[];
};

export type UnorderedList = {
  type: 'UNORDERED_LIST';
  value: ListItem[];
};

export type ListItem = {
  type: 'LIST_ITEM';
  value: Inlines[];
  number?: number;
};

export type Tasks = {
  type: 'TASKS';
  value: Task[];
};
export type Task = {
  type: 'TASK';
  status: boolean;
  value: Inlines[];
};

export type CodeLine = {
  type: 'CODE_LINE';
  value: Plain;
};

export type Color = {
  type: 'COLOR';
  value: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
};

export type BigEmoji = {
  type: 'BIG_EMOJI';
  value: [Emoji] | [Emoji, Emoji] | [Emoji, Emoji, Emoji];
};

export type Emoji =
  | {
      type: 'EMOJI';
      value: Plain;
      shortCode: string;
    }
  | {
      type: 'EMOJI';
      value: undefined;
      unicode: string;
    };

export type Code = {
  type: 'CODE';
  language: string | undefined;
  value: CodeLine[];
};

export type InlineCode = {
  type: 'INLINE_CODE';
  value: Plain;
};

export type Heading = {
  type: 'HEADING';
  level: 1 | 2 | 3 | 4;
  value: Plain[];
};

export type Quote = {
  type: 'QUOTE';
  value: Paragraph[];
};

export type Markup = Italic | Strike | Bold | Plain | ChannelMention;
export type MarkupExcluding<T extends Markup> = Exclude<Markup, T>;

export type Bold = {
  type: 'BOLD';
  value: Array<
    | MarkupExcluding<Bold>
    | Link
    | Emoji
    | UserMention
    | ChannelMention
    | InlineCode
  >;
};

export type Italic = {
  type: 'ITALIC';
  value: Array<
    | MarkupExcluding<Italic>
    | Link
    | Emoji
    | UserMention
    | ChannelMention
    | InlineCode
  >;
};

export type Strike = {
  type: 'STRIKE';
  value: Array<
    | MarkupExcluding<Strike>
    | Link
    | Emoji
    | UserMention
    | ChannelMention
    | InlineCode
    | Italic
    | Timestamp
  >;
};

export type Plain = {
  type: 'PLAIN_TEXT';
  value: string;
};

export type LineBreak = {
  type: 'LINE_BREAK';
  value: undefined;
};

export type KaTeX = {
  type: 'KATEX';
  value: string;
};

export type InlineKaTeX = {
  type: 'INLINE_KATEX';
  value: string;
};

export type Paragraph = {
  type: 'PARAGRAPH';
  value: Array<Exclude<Inlines, Paragraph>>;
};

export type Image = {
  type: 'IMAGE';
  value: {
    src: Plain;
    label: Markup;
  };
};

export type Link = {
  type: 'LINK';
  value: {
    src: Plain;
    label: Markup | Markup[];
  };
};

export type UserMention = {
  type: 'MENTION_USER';
  value: Plain;
};

export type ChannelMention = {
  type: 'MENTION_CHANNEL';
  value: Plain;
};

export type Timestamp = {
  type: 'TIMESTAMP';
  value: {
    timestamp: string;
    format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
  };
  fallback?: Plain;
};

export type Types = {
  BOLD: Bold;
  PARAGRAPH: Paragraph;
  PLAIN_TEXT: Plain;
  ITALIC: Italic;
  STRIKE: Strike;
  CODE: Code;
  CODE_LINE: CodeLine;
  INLINE_CODE: InlineCode;
  HEADING: Heading;
  QUOTE: Quote;
  LINK: Link;
  MENTION_USER: UserMention;
  MENTION_CHANNEL: ChannelMention;
  EMOJI: Emoji;
  BIG_EMOJI: BigEmoji;
  COLOR: Color;
  TASKS: Tasks;
  TASK: Task;
  UNORDERED_LIST: UnorderedList;
  ORDERED_LIST: OrderedList;
  LIST_ITEM: ListItem;
  IMAGE: Image;
  LINE_BREAK: LineBreak;
};

export type ASTNode =
  | BigEmoji
  | Bold
  | Paragraph
  | Plain
  | Italic
  | Strike
  | Code
  | CodeLine
  | InlineCode
  | Heading
  | Quote
  | Link
  | UserMention
  | ChannelMention
  | Emoji
  | Color
  | Tasks;

export type TypesKeys = keyof Types;

export type Inlines =
  | Timestamp
  | Bold
  | Plain
  | Italic
  | Strike
  | InlineCode
  | Image
  | Link
  | UserMention
  | ChannelMention
  | Emoji
  | Color
  | InlineKaTeX;

export type Blocks =
  | Code
  | Heading
  | Quote
  | ListItem
  | Tasks
  | OrderedList
  | UnorderedList
  | LineBreak
  | KaTeX;

export type Root = Array<Paragraph | Blocks> | [BigEmoji];
