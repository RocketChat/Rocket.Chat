{{
  const {
    autoEmail,
    autoLink,
    bigEmoji,
    bold,
    code,
    codeLine,
    color,
    emoji,
    emojiUnicode,
    emoticon,
    extractFirstResult,
    heading,
    image,
    inlineCode,
    inlineKatex,
    italic,
    katex,
    lineBreak,
    link,
    listItem,
    mentionChannel,
    mentionUser,
    orderedList,
    paragraph,
    phoneChecker,
    plain,
    quote,
    reducePlainTexts,
    strike,
    task,
    tasks,
    unorderedList,
    timestamp,
  } = require('./utils');

let skipBold = false;
let skipItalic = false;
let skipStrikethrough = false;
let skipReferences = false;
let skipBoldEmoji = false;
let skipItalicEmoji = false;
let skipInlineEmoji = false;
}}

Start
  = @BigEmoji !.
  / (Blocks / Paragraph / EndOfLine { return paragraph([plain('')]); })+

/**
 *
 * Blocks
 *
 */
Blocks
  = Blockquote
  / Code
  / Heading
  / Tasks
  / OrderedList
  / UnorderedList
  / Katex
  / LineBreak

/**
 *
 * Blockquote
 * e.g: > This is a blockquote
 *
 */
Blockquote = b:BlockquoteLine+ { return quote(b); }

BlockquoteLine = ">" [ \t]* @Paragraph

// <t:1630360800:?{format}>

TimestampType = "t" / "T" / "d" / "D" / "f" / "F" / "R"

Unixtime = d:Digit |10| { return d.join(''); }

Timestamp = "<t:" date:Unixtime ":" format:TimestampType ">" { return timestamp(date, format); } / "<t:" date:Unixtime ">" { return timestamp(date); }

/**
 *
 * Code Chunk
 * e.g:
 * ```js
 *     console.log('hello world');
 * ```
 */
Code = "```" language:CodeLanguage? EndOfLine lines:CodeLine+ EndOfLine "```" { return code(lines, language); }

CodeLanguage = $[a-zA-Z0-9 \_\-.]+

CodeLine
  = chunk:CodeChunk { return codeLine(chunk); }
  / "\n" chunk:CodeChunk { return codeLine(chunk); }
  / "\n" !"```" { return codeLine(plain('')); }

CodeChunk = text:$(!EndOfLine !"```" .)+ { return plain(text); }

/**
 *
 * Heading: h1,  h2, h3, h4
 * e.g:
 * # Heading 1
 * ## Heading 2
 * ### Heading 3
 * #### Heading 4
 *
*/
Heading = count:HeadingStart [ \t]+ text:HeadingChunk { return heading([text], count); }

HeadingStart = value:"#" |1..4| { return value.length; }

HeadingChunk = text:$(!EndOfLine .)+ { return plain(text); }

/**
 *
 * Tasks
 * e.g:
 * - [x] Task One (checked)
 * - [ ] Task two
 * - [x] Task three (checked)
 *
 */
Tasks = items:Task+ { return tasks(items); }

Task = "- [" flag:TaskFlag "]" [ \t]+ text:Inline { return task(text, flag); }

TaskFlag = "x" { return true; } / " " { return false; }

/**
 *
 * Ordered List
 * e.g:
 *  1. Item One
 *  2. Item Two
 *  3. Item Three
 *
 */
OrderedList = items:OrderedListItem+ { return orderedList(items); }

OrderedListItem = number:Digits "." [ \t]+ text:Inline { return listItem(text, parseInt(number, 10)); }

/**
 *
 * Unordered List
 * e.g:
 *  - Item One
 *  - Item Two
 *  * Item Three
 *  * Item Four
 *
 */
UnorderedList = items:(UnorderedListHyphenItem+ / UnorderedListAsteriskItem+) { return unorderedList(items); }

UnorderedListHyphenItem = "-" [ \t]+ text:Inline { return listItem(text); }

UnorderedListAsteriskItem = "*" [ \t]+ text:UnorderedListItemContent { return listItem(text); }

UnorderedListItemContent = value:UnorderedListItemContentItem+ !"*" EndOfLine? { return reducePlainTexts(value); }

UnorderedListItemContentItem = & {skipInlineEmoji = false; return true} item:(InlineItemPattern / !"*" @Any) { skipInlineEmoji = false; return item }

/**
 *
 * KaTex
 * e.g: \[ KATEX_HERE \] OR $$ KATEX_HERE $$
 * $$x = \begin{cases}
 * a &\text{if } b \\
 * c &\text{if } d
 * \end{cases}$$
 *
 */
Katex = KatexStart content:$(!KatexEnd .)* KatexEnd { return katex(content); }

KatexStart
  = & { return options.katex?.parenthesisSyntax; } "\\["
  / & { return options.katex?.dollarSyntax; } "$$"

KatexEnd
  = & { return options.katex?.parenthesisSyntax; } "\\]"
  / & { return options.katex?.dollarSyntax; } "$$"

KatexInline
  = KatexInlineStart content:$(!KatexInlineEnd .)* KatexInlineEnd {
      return inlineKatex(content);
    }

KatexInlineStart
  = & { return options.katex?.parenthesisSyntax; } "\\("
  / & { return options.katex?.dollarSyntax; } "$"

KatexInlineEnd
  = & { return options.katex?.parenthesisSyntax; } "\\)"
  / & { return options.katex?.dollarSyntax; } "$"

/**
 *
 * LineBreak
 * e.g: \n
 *
*/
LineBreak = Space* EndOfLine { return lineBreak(); }

/**
 *
 * Paragraph
 * e.g: This is a paragraph
*/
Paragraph = value:Inline { return paragraph(value); }

/**
 *
 * Inline
 *
*/
Inline = & {skipInlineEmoji = false; return true; } value:InlinePattern+ EndOfLine? { skipInlineEmoji = false; return reducePlainTexts(value); }

InlinePattern = InlineItem / InlineItemFallback

InlineItem = item:InlineItemPattern { skipInlineEmoji = false; return item; }

InlineItemFallback = item:Any { skipInlineEmoji = true; return item; }

InlineEmoji = & { return !skipInlineEmoji; } emo:Emoji { return emo; }

InlineEmoticon = & { return !skipInlineEmoji; } emo:Emoticon & (EmoticonNeighbor / InlineItemPattern) { skipInlineEmoji = false; return emo; }

InlineItemPattern = Whitespace
  / Timestamp
  / MaybeReferences
  / AutolinkedPhone
  / AutolinkedEmail
  / AutolinkedURL
  / EmphasisWithWhitespace
  / Emphasis
  / UserMention
  / ChannelMention
  / InlineEmoji
  / InlineCode
  / Image
  / InlineEmoticon
  / Color
  / KatexInline
  / Escaped

/**
 *
 * URL
 * e.g:
 * Reference: [Rocket.Chat Website](https://rocket.chat), [](https://rocket.chat), <rocket.chat|Rocket.Chat Website>
 * Image: ![](https://rocket.chat/logo.png)
 *
 */
References
  = "[" title:LinkTitle* "](" href:LinkRef ")" { return title.length ? link(href, reducePlainTexts(title)) : link(href); }
  / "<" href:LinkRef "|" title:LinkTitle2 ">" { return link(href, [plain(title)]); }

LinkTitle = (Whitespace / Emphasis) / anyTitle:$(!("](" .) .) { return plain(anyTitle) }

LinkTitle2 = $([\x20-\x3B\x3D\x3F-\x60\x61-\x7B\x7D-\xFF] / NonASCII)+

LinkRef = URL / FilePath / p:Phone { return 'tel:' + p.number; } // TODO: Accept parenthesis

FilePath = $(URLScheme URLBody+)

Image = "![" title:Line? "](" href:LinkRef ")" { return title ? image(href, title) : image(href); }

URL
  = $(URLScheme URLAuthority URLBody*)
  / $(URLAuthorityHost URLBody*)

URLScheme = $([A-Za-z0-9+-] |1..32| ":")

URLBody
  = (
    !(Extra+ (Whitespace / EndOfLine) / Whitespace)
    (AnyText / [*\[\/\]\^_`{}~(])
  )+

URLAuthority = $("//" URLAuthorityUserInfo? URLAuthorityHost)

URLAuthorityUserInfo = $(URLAuthorityUser (":" URLAuthorityPassword)? "@")

URLAuthorityUser = $(AlphaDigit / ![@/] Safe)+

URLAuthorityPassword = $(AlphaDigit / ![@/] Safe)+

URLAuthorityHost = URLAuthorityHostName (":" URLAuthorityPort)?

URLAuthorityHostName
  = DomainName
  / $(Digits |4, "."|) // TODO: IPv4 and IPv6

URLAuthorityPort
  = Digits // TODO: from "0" to "65535"

DomainName
  = "localhost"
  / $(DomainNameLabel ("." DomainChar DomainNameLabel*)+)

DomainNameLabel = $(DomainChar+ ("-" DomainChar+)*)

DomainChar = !Extra ([\__-] / !Safe) !EndOfLine !Space ![\\/|><%`] .

/**
 *
 * Phone
 * e.g: 075-63546725
 *
 */
Phone = "+" p:PhoneNumber { return { text: '+' + p.text, number: p.number }; }

PhoneNumber
  = p:PhonePrefix "-" d:Digits {
      return { text: p.text + '-' + d, number: p.number + d };
    }
  / p:PhonePrefix d1:Digits "-" d2:Digits {
      return { text: p.text + d1 + '-' + d2, number: p.number + d1 + d2 };
    }
  / p:PhonePrefix d:Digits {
      return { text: p.text + d, number: p.number + d };
    }
  / d:Digits { return { text: d, number: d }; }

PhonePrefix
  = d:Digits { return { text: d, number: d }; }
  / "(" d:Digits ")" { return { text: '(' + d + ')', number: d }; }

AutolinkedPhone = p:Phone { return phoneChecker(p.text, p.number); }

/**
 *
 * Email
 * e.g: contact@rocket.chat
 *
 */
Email = "mailto:"? @$(LocalPart "@" DomainName)

LocalPart = $(LocalPartChar+ ("." LocalPartChar+)*)

LocalPartChar = AlphaNumericOrMarkChar+ LocalPartSpecialChars*

LocalPartSpecialChars = [!#$%&'*+/=?^_\`{|}~-]

AutolinkedEmail = e:Email { return autoEmail(e); }

/**
 *
 * Auto Link URL
 * e.g: rocket.chat, https://rocket.chat,
 * with customDomains options as intranet: protocol://internaltool.intranet
 *
 */
AutolinkedURL = u:AutoLinkURL { return autoLink(u, options.customDomains); }

AutoLinkURL
  = $(URLScheme URLAuthority AutoLinkURLBody*)
  / $(URLAuthorityHost AutoLinkURLBody*)

AutoLinkURLBody =  !(Extra* (Whitespace / EndOfLine)) .

/**
 *
 * Emphasis
 *
*/
Emphasis = MaybeBold / MaybeItalic / MaybeStrikethrough

/**
 *
 * Italic, Bold and Strike
 * e.g: __italic__, _italic_, **bold**, __*bold italic*__, ~~strikethrough~~
 *
 */

// This rule is used inside expressions that have a JS code ensuring they always fail,
// Without any pattern to match, peggy will think the rule may end up succedding without consuming any input, which could cause infinite loops
// So this unreachable rule is added to them to satisfy peggy's requirement.
BlockedByJavascript = 'unreachable'

MaybeBold
  = result:(
    & {
      if (skipBold) { return false; }
      skipBold = true;
      return true;
    }
    (
      (text:Bold { skipBold = false; return text; })
      / (& { skipBold = false; return false; } BlockedByJavascript)
    )
  ) { return extractFirstResult(result); }

MaybeStrikethrough
  = result:(
    & {
      if (skipStrikethrough) { return false; }
      skipStrikethrough = true;
      return true;
    }
    (
      (text:Strikethrough { skipStrikethrough = false; return text; })
      / (& { skipStrikethrough = false; return false; } BlockedByJavascript)
    )
  ) { return extractFirstResult(result); }

MaybeItalic
  = result:(
    & {
      if (skipItalic) { return false; }
      skipItalic = true;
      return true;
    }
    (
      (text:Italic { skipItalic = false; return text; })
      / (& { skipItalic = false; return false; } BlockedByJavascript)
    )
  ) { return extractFirstResult(result); }

MaybeReferences
  = result:(
    & {
      if (skipReferences) { return false; }
      skipReferences = true;
      return true;
    }
    (
      (text:References { skipReferences = false; return text; })
      / (& { skipReferences = false; return false; } BlockedByJavascript)
    )
  ) { return extractFirstResult(result); }

/* Italic */
Italic
   = value:$([a-zA-Z0-9]+ [\x5F] [\x5F]?) { return plain(value); }
  / [\x5F] [\x5F] i:ItalicContentItems [\x5F] [\x5F] t:$[a-zA-Z0-9]+ {
      return reducePlainTexts([plain('__'), ...i, plain('__'), plain(t)]);
    }
  / [\x5F] i:ItalicContentItems [\x5F] t:$[a-zA-Z]+ {
      return reducePlainTexts([plain('_'), ...i, plain('_'), plain(t)]);
    }
  / [\x5F] [\x5F] @ItalicContent [\x5F] [\x5F]
  / [\x5F] @ItalicContent [\x5F]

ItalicContent = & { skipItalicEmoji = false; return true; } text:ItalicContentItems { skipItalicEmoji = false; return italic(text); }

ItalicContentItems = text:ItalicContentItem+ { return reducePlainTexts(text); }

ItalicContentItem = ItalicContentPreferentialItem / ItalicContentFallbackItem

ItalicContentPreferentialItem = item:ItalicContentPreferentialItemPattern { skipItalicEmoji = false; return item; }

ItalicContentPreferentialItemPattern = Whitespace
  / InlineCode
  / MaybeReferences
  / UserMention
  / ChannelMention
  / MaybeBold
  / MaybeStrikethrough
  / ItalicEmoji
  / ItalicEmoticon

ItalicContentFallbackItem = item:ItalicContentFallbackItemPattern { skipItalicEmoji = true; return item; }

ItalicContentFallbackItemPattern = AnyItalic / Line

ItalicEmoji = & { return !skipItalicEmoji; } emo:Emoji { return emo; }

ItalicEmoticon = & { return !skipItalicEmoji; } emo:Emoticon & (EmoticonNeighbor / ItalicContentPreferentialItem / [\x5F]) { skipItalicEmoji = false; return emo; }

/* Bold */
Bold = [\x2A] [\x2A] @BoldContent [\x2A] [\x2A] / [\x2A] @BoldContent [\x2A]

BoldContent = & { skipBoldEmoji = false; return true; } text:BoldContentItem+ { skipBoldEmoji = false; return bold(reducePlainTexts(text)); }

BoldContentPreferentialItem = item:BoldContentPreferentialItemPattern { skipBoldEmoji = false; return item; }

BoldContentPreferentialItemPattern = Whitespace / InlineCode / MaybeReferences / UserMention / ChannelMention / MaybeItalic / MaybeStrikethrough / BoldEmoji / BoldEmoticon

BoldContentFallbackItem = item:BoldContentFallbackItemPattern { skipBoldEmoji = true; return item; }

BoldContentFallbackItemPattern = AnyBold / Line

BoldContentItem = BoldContentPreferentialItem / BoldContentFallbackItem

BoldEmoji = & { return !skipBoldEmoji; } emo:Emoji { return emo; }

BoldEmoticon = & { return !skipBoldEmoji; } emo:Emoticon & (EmoticonNeighbor / BoldContentPreferentialItem) { skipBoldEmoji = false; return emo; }

/* Strike */
Strikethrough = [\x7E] [\x7E] @StrikethroughContent [\x7E] [\x7E] / [\x7E] @StrikethroughContent [\x7E]

StrikethroughContent = text:(Timestamp / Whitespace / InlineCode / MaybeReferences / UserMention / ChannelMention / MaybeItalic / MaybeBold / Emoji / Emoticon / AnyStrike / Line)+ {
      return strike(reducePlainTexts(text));
    }

AnyBold = t:[^\x0a\* ] { return plain(t); }

AnyStrike = t:[^\x0a\~ ] { return plain(t); }

AnyItalic = t:[^\x0a\_ ] { return plain(t); }

/**
 * Emphasis with only whitespaces return plain text
 * e.g: __ __, _ _, ** **, * *, ** *, ~~ ~~
*/
EmphasisWithWhitespace = AsteriskWithWhitespace / UnderscoreWithWhitespace / TildeWithWhitespace

AsteriskWithWhitespace = first:Asterisk second:Whitespace third:Asterisk
{
  return reducePlainTexts([first,second,third])[0];
}

UnderscoreWithWhitespace = first:Underscore second:Whitespace third:Underscore
{
  return reducePlainTexts([first,second,third])[0];
}

TildeWithWhitespace = first:Tilde second:Whitespace third:Tilde
{
  return reducePlainTexts([first,second,third])[0];
}

Asterisk = t:"*"+ {return plain(t.join(""))}
Underscore = t:"_"+ {return plain(t.join(""))}
Tilde = t:"~"+ {return plain(t.join(""))}

/**
 *
 * Mentions
 * e.g: @user, #channel
 *
*/
UserMention
  = t:Text "@"+ user:AlphaNumericChar {
      return reducePlainTexts([t, plain('@' + user)])[0];
    }
  / "@"+ user:$(UTF8NamesValidation ([:@] UTF8NamesValidation)?) {
      return mentionUser(user);
    }

ChannelMention
  = t:Text "#" channel:AlphaNumericChar {
      return reducePlainTexts([t, plain('#' + channel)])[0];
    }
  / "#" channel:UTF8NamesValidation { return mentionChannel(channel); }

/**
 *
 * EMOJIS
 * e.g:
 * BigEmoji  (min: 1 | max: 3 without text) and ShortCode :smile: :+1: :heart:
 * Unicode: 😀 🚀 🌈
 * Emoticon: :D :P :( :/
 *
 */
BigEmoji = (EndOfLine / Space)* es:(@(Emoji / Emoticon) (EndOfLine / Space)*) |1..3| { return [bigEmoji(es)]; }

Emoji = EmojiShortCode / ch:UnicodeEmoji { return emojiUnicode(ch); }

EmojiShortCode = ":" shortCode:EmojiShortCodeName ":" { return emoji(shortCode); }

EmojiShortCodeName = $[0-9a-zA-Z-_+.]+

/* Emoticons */
Emoticon = & { return options.emoticons; } @EmoticonPattern

EmoticonNeighbor = EndOfLine / Whitespace / [\x2A] / !.

EmoticonPattern
  = e:$"<3" { return emoticon(e, 'heart'); }
  / e:$"</3" { return emoticon(e, 'broken_heart'); }
  / e:$(":D" / ":-D" / "=D") { return emoticon(e, 'smiley'); }
  / e:$(">:)" / ">;)" / ">:-)" / ">=)") { return emoticon(e, 'laughing'); }
  / e:$("':)" / "':-)" / "'=)" / "':D" / "':-D" / "'=D") {
      return emoticon(e, 'sweat_smile');
    }
  / e:$(":')" / ":'-)") { return emoticon(e, 'joy'); }
  / e:$(
    "O:-)"
    / "0:-3"
    / "0:3"
    / "0:-)"
    / "0:)"
    / "0;^)"
    / "O:)"
    / "O;-)"
    / "O=)"
    / "0;-)"
    / "O:-3"
    / "O:3"
  ) { return emoticon(e, 'innocent'); }
  / e:$(":)" / ":-)" / "=]" / "=)" / ":]") {
      return emoticon(e, 'slight_smile');
    }
  / e:$(";)" / ";-)" / "*-)" / "*)" / ";-]" / ";]" / ";D" / ";^)") {
      return emoticon(e, 'wink');
    }
  / e:$(":*" / ":-*" / "=*" / ":^*") { return emoticon(e, 'kissing_heart'); }
  / e:$(":P" / ":-P" / "=P" / ":-\u00de" / ":\u00de" / ":-b" / ":b") {
      return emoticon(e, 'stuck_out_tongue');
    }
  / e:$(">:P" / "X-P") { return emoticon(e, 'stuck_out_tongue_winking_eye'); }
  / e:$("B-)" / "B)" / "8)" / "8-)" / "B-D" / "8-D") {
      return emoticon(e, 'sunglasses');
    }
  / e:$(">:[" / ":-(" / ":(" / ":-[" / ":[" / "=(") {
      return emoticon(e, 'disappointed');
    }
  / e:$(
    ">:\\"
    / ">:\/"
    / ":-\/"
    / ":-."
    / ":\/"
    / ":\\"
    / "=\/"
    / "=\\"
    / ":L"
    / "=L"
  ) { return emoticon(e, 'confused'); }
  / e:$">.<" { return emoticon(e, 'persevere'); }
  / e:$(":'(" / ":'-(" / ";(" / ";-(") { return emoticon(e, 'cry'); }
  / e:$(">:(" / ">:-(" / ":@") { return emoticon(e, 'angry'); }
  / e:$(":$" / "=$") { return emoticon(e, 'flushed'); }
  / e:$"D:" { return emoticon(e, 'fearful'); }
  / e:$("':(" / "':-(" / "'=(") { return emoticon(e, 'sweat'); }
  / e:$(":-X" / ":X" / ":-#" / ":#" / "=X" / "=#") {
      return emoticon(e, 'no_mouth');
    }
  / e:$("-_-" / "-__-" / "-___-") { return emoticon(e, 'expressionless'); }
  / e:$(":-O" / ":O" / "O_O" / ">:O") { return emoticon(e, 'open_mouth'); }
  / e:$("#-)" / "#)" / "%-)" / "%)" / "X)" / "X-)") {
      return emoticon(e, 'dizzy_face');
    }
  / e:$"(y)" { return emoticon(e, 'thumbsup'); }
  / e:$("*\\0\/*" / "\\0\/" / "*\\O\/*" / "\\O\/") {
      return emoticon(e, 'person_gesturing_ok');
    }

/* Unicode emojis */
UnicodeEmoji
  = UnicodeEmojiEmoticon
  / $(
    UnicodeEmojiSupplementalSymbolsAndPictographs
      (
        UnicodeEmojiMiscellaneousSymbolsAndPictographs
          ([\u200D] UnicodeEmojiMiscellaneousSymbolsAndPictographs)*
      )?
  )
  / $(
    (
        UnicodeEmojiMiscellaneousSymbolsAndPictographs
          UnicodeEmojiMiscellaneousSymbolsAndPictographsFitzpatrickModifiers?
          [\u200D]
      )*
      UnicodeEmojiMiscellaneousSymbolsAndPictographs
      UnicodeEmojiMiscellaneousSymbolsAndPictographsFitzpatrickModifiers?
  )
  / UnicodeEmojiTransportAndMapSymbols
  / UnicodeEmojiMiscellaneousTechnical
  / UnicodeEmojiMiscellaneousSymbols
  / UnicodeEmojiDingbats
  / UnicodeEmojiFlags

UnicodeEmojiEmoticon = $([\uD83D] [\uDE00-\uDE4F])

UnicodeEmojiSupplementalSymbolsAndPictographs = $([\uD83E] [\uDD00-\uDDFF])

UnicodeEmojiMiscellaneousSymbolsAndPictographs = $([\uD83C] [\uDF00-\uDFFF] [\uFE00-\uFE0F]?) / $([\uD83D] [\uDC00-\uDDFF] [\uFE00-\uFE0F]?)

UnicodeEmojiMiscellaneousSymbolsAndPictographsFitzpatrickModifiers = $([\uD83C] [\uDFFB-\uDFFF])

UnicodeEmojiTransportAndMapSymbols = $([\uD83D] [\uDE80-\uDEFA])

UnicodeEmojiMiscellaneousTechnical = $([\u2300-\u23FF] [\uFE00-\uFE0F]?)

UnicodeEmojiMiscellaneousSymbols = $([\u2600-\u26FF] [\uFE00-\uFE0F]?)

UnicodeEmojiDingbats = $([\u2700-\u27BF] [\uFE00-\uFE0F]?)

UnicodeEmojiFlags = $([\uD83C] [\uDD00-\uDDFF] [\uD83C] [\uDD00-\uDDFF])

/**
 *
 * Inline Code
 * e.g: `console.log('hello world')`
 *
 */
InlineCode = "`" text:$InlineCode__+ "`" { return inlineCode(plain(text)); }

InlineCode__ = $(!"`" !"\n" .)

/**
 *
 * Colors
 * e.g: color:#ff0000 , color:#ff0
 *
 */
Color = & { return options.colors; } "color:#" rgba:ColorRGBATuple !AnyText {
      return color(...rgba);
    }

ColorRGBATuple = HexByte|3..4| / HexNible|3..4|

/**
 *
 * Macros
 *
 */
Whitespace = w:$Space+ { return plain(w); }

EndOfLine = "\r\n" / "\n" / "\r"

Space = " " / "\t"

Escaped = "\\" t:[*_~`#.] { return plain(t); }

Any = !EndOfLine t:. p:$AutolinkedPhone? u:$URL? { return plain(t + p + u); }

AnyText = [\x20-\x27\x2B-\x40\x41-\x5A\x61-\x7A] / NonASCII

Text = text:AnyText { return plain(text); }

Line = t:LineStructure { return plain(t); }

LineStructure = head:$Space* text:$AnyText+ tail:$Space* { return head + text + tail; }

UTF8NamesValidation = $([-_.] / AlphaNumericChar)+

NonASCII = [\x80-\uFFFF]

Unicode = "\\" Digits:$(HexDigit |1..6|) ("\r\n" / [ \t\r\n\f])? { return String.fromCharCode(parseInt(Digits, 16)); }

Digit = [0-9]

Digits = $Digit+

Safe = [$@&+\__#?-]

Extra = [.,!%~*\"':;()=~]

HexDigit = [0-9A-Fa-f]

HexNible = a:HexDigit { return parseInt(a + a, 16); }

HexByte = a:HexDigit b:HexDigit { return parseInt(a + b, 16); }

AlphaDigit = [a-zA-Z0-9]

AlphaNumericOrMarkChar = AlphaOrMarkChar / DecimalNumberChar

AlphaOrMarkChar = AlphaChar / EmojiChar / MarkChar

AlphaNumericChar = AlphaChar / DecimalNumberChar

AlphaChar = [A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]

DecimalNumberChar = [0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19]

EmojiChar = [\u2700-\u27bf\udde6-\uddff\ud800-\udbff\udc00-\udfff\ufe0e\ufe0f\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0\ud83c\udffb-\udfff\u200d\u3299\u3297\u303d\u3030\u24c2\ud83c\udd70-\udd71\udd7e-\udd7f\udd8e\udd91-\udd9a\udde6-\uddff\ude01-\ude02\ude1a\ude2f\ude32-\ude3a\ude50-\ude51\u203c\u2049\u25aa-\u25ab\u25b6\u25c0\u25fb-\u25fe\u00a9\u00ae\u2122\u2139\udc04\u2600-\u26FF\u2b05\u2b06\u2b07\u2b1b\u2b1c\u2b50\u2b55\u231a\u231b\u2328\u23cf\u23e9-\u23f3\u23f8-\u23fa\udccf\u2935\u2934\u2190-\u21ff]

MarkChar = [\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]
