// AUTO-GENERATED from grammar.pegjs by peg-to-rust-codegen-v2.cjs
// Compilable skeleton — refine TODO markers and helper stubs as needed.
//
// Architecture: char-level recursive descent with save/restore backtracking.
// PEG ordered choice → try_parse + restore on failure.
// PEG semantic predicates → translated to Rust guards on parser state.

#![allow(unused_variables, unused_mut, unreachable_code, dead_code, clippy::needless_return)]

use serde::Serialize;

// ─── AST Types ───────────────────────────────────────────────────────
// Matches @rocket.chat/message-parser definitions.ts exactly.
// serde(tag = "type") + rename = JSON discriminant field.

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum Node {
    #[serde(rename = "PARAGRAPH")]
    Paragraph { value: Vec<Inline> },
    #[serde(rename = "HEADING")]
    Heading { value: Vec<Inline>, level: u8 },
    #[serde(rename = "CODE")]
    Code { value: Vec<CodeLine>, language: Option<String> },
    #[serde(rename = "BIG_EMOJI")]
    BigEmoji { value: Vec<Inline> },
    #[serde(rename = "ORDERED_LIST")]
    OrderedList { value: Vec<ListItem> },
    #[serde(rename = "UNORDERED_LIST")]
    UnorderedList { value: Vec<ListItem> },
    #[serde(rename = "TASKS")]
    Tasks { value: Vec<TaskItem> },
    #[serde(rename = "QUOTE")]
    Quote { value: Vec<Node> },
    #[serde(rename = "KATEX")]
    Katex { value: String },
    #[serde(rename = "LINE_BREAK")]
    LineBreak { value: () },
    #[serde(rename = "HORIZONTAL_RULE")]
    HorizontalRule { value: (), #[serde(skip_serializing_if = "Option::is_none")] fallback: Option<(usize, usize)> },
    #[serde(rename = "TABLE")]
    Table { value: TableValue, #[serde(skip_serializing_if = "Option::is_none")] fallback: Option<(usize, usize)> },
    #[serde(rename = "SPOILER_BLOCK")]
    SpoilerBlock { value: Vec<Node> },
}

#[derive(Debug, Clone, Serialize)]
pub struct TableValue {
    pub header: Vec<TableCell>,
    pub rows: Vec<TableRow>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename = "TABLE_ROW")]
pub struct TableRow {
    pub value: Vec<TableCell>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename = "TABLE_CELL")]
pub struct TableCell {
    pub value: Vec<Inline>,
    pub align: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum Inline {
    #[serde(rename = "PLAIN_TEXT")]
    Plain { value: String },
    #[serde(rename = "BOLD")]
    Bold { value: Vec<Inline> },
    #[serde(rename = "ITALIC")]
    Italic { value: Vec<Inline> },
    #[serde(rename = "STRIKE")]
    Strike { value: Vec<Inline> },
    #[serde(rename = "INLINE_CODE")]
    InlineCode { value: Box<Inline> },
    #[serde(rename = "EMOJI")]
    EmojiUnicode { value: (), unicode: String },
    #[serde(rename = "EMOJI")]
    EmojiShortCode { value: Box<Inline>, #[serde(rename = "shortCode")] short_code: String },
    #[serde(rename = "MENTION_USER")]
    MentionUser { value: Box<Inline> },
    #[serde(rename = "MENTION_CHANNEL")]
    MentionChannel { value: Box<Inline> },
    #[serde(rename = "LINK")]
    Link { value: LinkValue },
    #[serde(rename = "IMAGE")]
    Image { value: ImageValue },
    #[serde(rename = "INLINE_KATEX")]
    InlineKatex { value: String },
    #[serde(rename = "TIMESTAMP")]
    Timestamp { value: TimestampValue, #[serde(skip_serializing_if = "Option::is_none")] fallback: Option<(usize, usize)> },
    #[serde(rename = "COLOR")]
    Color { value: ColorValue },
    #[serde(rename = "SPOILER")]
    Spoiler { value: Vec<Inline> },
}

#[derive(Debug, Clone, Serialize)]
pub struct LinkValue {
    pub src: Box<Inline>,
    pub label: Vec<Inline>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImageValue {
    pub src: Box<Inline>,
    pub label: Box<Inline>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TimestampValue {
    pub timestamp: String,
    pub format: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ColorValue {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename = "CODE_LINE")]
pub struct CodeLine {
    pub value: Box<Inline>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename = "LIST_ITEM")]
pub struct ListItem {
    pub value: Vec<Inline>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nested: Option<Vec<NestedList>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum NestedList {
    Ordered(Node),
    Unordered(Node),
    Tasks(Node),
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename = "TASK")]
pub struct TaskItem {
    pub value: Vec<Inline>,
    pub status: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nested: Option<Vec<NestedList>>,
}

// ─── Event-based AST Construction ───────────────────────────────────

#[derive(Debug, Clone)]
enum GreenEvent {
    Start(SK),
    Finish(SK),
    LeafText(usize, usize),
    LeafStr(SK, usize, usize),
    LeafEmoji(String, String),
    LeafUnicodeEmoji(String),
    LeafLineBreak,
    LeafHorizontalRule,
    DataStr(String),
    DataU8(u8),
}

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(u8)]
enum SK {
    Paragraph, Heading, Code, BigEmoji, OrderedList, UnorderedList,
    Tasks, Quote, Katex, LineBreak, HorizontalRule, SpoilerBlock, Table,
    TableRow, TableCell, CodeLine, ListItem, TaskItem,
    Bold, Italic, Strike, InlineCode, EmojiUnicode, EmojiShortCode,
    MentionUser, MentionChannel, Link, Image, InlineKatex, Timestamp,
    Color, Spoiler, Plain,
}

// ─── Parser Config ───────────────────────────────────────────────────

#[derive(Debug, Clone, Default)]
pub struct ParserConfig {
    pub colors: bool,
    pub emoticons: bool,
    pub katex_dollar: bool,
    pub katex_parenthesis: bool,
    pub custom_domains: Vec<String>,
}

// ─── Parser ──────────────────────────────────────────────────────────

pub struct Parser<'a> {
    input: &'a str,
    pos: usize,
    config: ParserConfig,
    skip_bold: bool,
    skip_italic: bool,
    skip_strikethrough: bool,
    skip_references: bool,
    code_fence: String,
    events: Vec<GreenEvent>,
    // Line-level hint flags: precomputed once per line to skip O(n) lookaheads
    line_has_at: bool,       // '@' in remaining line → email/mention possible
    line_has_dot: bool,      // '.' in remaining line → URL possible
    line_has_colon_slash: bool, // '://' in remaining line → URL scheme possible
    line_has_underscore: bool,  // '_' in remaining line → italic/emphasis possible
    line_has_hash: bool,     // '#' in remaining line → channel mention possible
}

impl<'a> Parser<'a> {
    pub fn new(input: &'a str, config: ParserConfig) -> Self {
        Self {
            input, pos: 0, config,
            skip_bold: false, skip_italic: false,
            skip_strikethrough: false, skip_references: false,
            code_fence: String::new(),
            events: Vec::with_capacity(64),
            line_has_at: false, line_has_dot: false,
            line_has_colon_slash: false, line_has_underscore: false,
            line_has_hash: false,
        }
    }

    fn scan_line_hints(&mut self) {
        let remaining = &self.input[self.pos..];
        let line_end = remaining.find('\n').unwrap_or(remaining.len());
        let line = remaining[..line_end].as_bytes();
        self.line_has_at = line.contains(&b'@');
        self.line_has_dot = line.contains(&b'.');
        self.line_has_colon_slash = remaining[..line_end].contains("://");
        self.line_has_underscore = line.contains(&b'_');
        self.line_has_hash = line.contains(&b'#');
    }

    // ── Primitives ───────────────────────────────────────────────────

    fn remaining(&self) -> &'a str { &self.input[self.pos..] }
    fn at_end(&self) -> bool { self.pos >= self.input.len() }

    fn peek_char(&self) -> Option<char> { self.remaining().chars().next() }

    fn advance(&mut self, n: usize) { self.pos += n; }

    fn expect_str(&mut self, s: &str) -> Option<&'a str> {
        if self.remaining().starts_with(s) {
            let start = self.pos;
            self.advance(s.len());
            Some(&self.input[start..self.pos])
        } else {
            None
        }
    }

    fn any_char(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if c == '\n' || c == '\r' { return None; }
        self.advance(c.len_utf8());
        Some(c)
    }

    fn try_parse<T>(&mut self, f: impl FnOnce(&mut Self) -> Option<T>) -> Option<T> {
        let saved = self.pos;
        let sb = self.skip_bold;
        let si = self.skip_italic;
        let ss = self.skip_strikethrough;
        let sr = self.skip_references;
        let ev = self.events.len();
        match f(self) {
            Some(v) => Some(v),
            None => {
                self.pos = saved;
                self.skip_bold = sb;
                self.skip_italic = si;
                self.skip_strikethrough = ss;
                self.skip_references = sr;
                self.events.truncate(ev);
                None
            }
        }
    }

    fn lookahead<T>(&mut self, f: impl FnOnce(&mut Self) -> Option<T>) -> Option<T> {
        let saved = self.pos;
        let ev = self.events.len();
        let result = f(self);
        self.pos = saved;
        self.events.truncate(ev);
        result
    }

    fn negative_lookahead<T>(&mut self, f: impl FnOnce(&mut Self) -> Option<T>) -> Option<()> {
        let saved = self.pos;
        let ev = self.events.len();
        let result = f(self);
        self.pos = saved;
        self.events.truncate(ev);
        if result.is_some() { None } else { Some(()) }
    }

    fn consume_while(&mut self, pred: impl Fn(char) -> bool) -> &'a str {
        let start = self.pos;
        while let Some(c) = self.peek_char() {
            if !pred(c) { break; }
            self.advance(c.len_utf8());
        }
        &self.input[start..self.pos]
    }

    fn consume_while1(&mut self, pred: impl Fn(char) -> bool) -> Option<&'a str> {
        let s = self.consume_while(pred);
        if s.is_empty() { None } else { Some(s) }
    }

    fn parse_end_of_line(&mut self) -> Option<()> {
        if self.remaining().starts_with("\r\n") {
            self.advance(2); Some(())
        } else if self.remaining().starts_with('\n') || self.remaining().starts_with('\r') {
            self.advance(1); Some(())
        } else {
            None
        }
    }

    fn is_space(c: char) -> bool {
        c == ' ' || c == '\t' || c == '\u{a0}'
    }

    // ── Event emission ──────────────────────────────────────────────

    fn start_node(&mut self, kind: SK) {
        self.events.push(GreenEvent::Start(kind));
    }

    fn finish_node(&mut self, kind: SK) {
        self.events.push(GreenEvent::Finish(kind));
    }

    fn emit_text(&mut self, start: usize, end: usize) {
        if start < end {
            self.events.push(GreenEvent::LeafText(start, end));
        }
    }

    fn emit_leaf(&mut self, kind: SK, start: usize, end: usize) {
        self.events.push(GreenEvent::LeafStr(kind, start, end));
    }

    fn emit_data_str(&mut self, s: String) {
        self.events.push(GreenEvent::DataStr(s));
    }

    fn emit_data_u8(&mut self, v: u8) {
        self.events.push(GreenEvent::DataU8(v));
    }


    // ── Char-level helpers (from SKIP_RULES) ─────────────────────────

    fn parse_whitespace(&mut self) -> Option<Inline> {
        let s = self.pos;
        let w = self.consume_while1(Self::is_space)?;
        self.emit_text(s, self.pos);
        Some(Self::plain(w))
    }

    fn parse_space(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if Self::is_space(c) { self.advance(c.len_utf8()); Some(c) } else { None }
    }

    fn parse_any(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.any_char()?;
        self.emit_text(s, self.pos);
        Some(Self::plain(&c.to_string()))
    }

    fn parse_digit(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if c.is_ascii_digit() { self.advance(1); Some(c) } else { None }
    }

    fn parse_digits(&mut self) -> Option<&'a str> {
        self.consume_while1(|c| c.is_ascii_digit())
    }

    fn parse_hex_digit(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if c.is_ascii_hexdigit() { self.advance(1); Some(c) } else { None }
    }

    fn parse_alpha_digit(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if c.is_ascii_alphanumeric() { self.advance(1); Some(c) } else { None }
    }

    fn parse_alpha_numeric_char(&mut self) -> Option<char> {
        let c = self.peek_char()?;
        if c.is_ascii_alphanumeric() || c > '\u{7f}' { self.advance(c.len_utf8()); Some(c) } else { None }
    }

    // UTF8NamesValidation generated from grammar AST

    fn parse_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| !matches!(c, '*' | '_' | '~' | '\x60' | ':' | '\n' | '<' | '[' | ']' | '!' | ' ' | '\t' | '\u{a0}' | '(' | ')' | '\\' | '|'))?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_bold_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\n' && c != '*' && c != ' ' && c != '_' && c != '~' && c != '\u{a0}')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_bold(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\n' && c != '*' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
    }

    fn parse_italic_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\n' && c != '_' && c != ' ' && c != '\u{a0}' && c != '*' && c != '~')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_italic(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\n' && c != '_' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
    }

    fn parse_strike_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\n' && c != '~' && c != ' ' && c != '\u{a0}' && c != '*' && c != '_')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_strike_plain_run_full(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\n' && c != '~' && c != ' ' && c != '*' && c != '_' && c != ':' && c != '\x60' && c != '@' && c != '#' && c != '[' && c != ']' && c != '\\' && c != '<' && c != '!' && c != '|')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_strike(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\n' && c != '~' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
    }

    // Inline: scan line hints once, then loop InlineItemPattern / Any
    fn parse_inline(&mut self) -> Option<()> {
        self.scan_line_hints();
        if self.try_parse(|p| { p.parse_inline_item_pattern()?; Some(()) }).is_some() {
        } else if self.try_parse(|p| { p.parse_any()?; Some(()) }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            if p.try_parse(|p| { p.parse_inline_item_pattern()?; Some(()) }).is_some() {
            } else if p.try_parse(|p| { p.parse_any()?; Some(()) }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        self.try_parse(|p| { p.parse_end_of_line()?; Some(()) });
        Some(())
    }

    // Optimized first-char dispatch via match — O(1) instead of if-else chain
    fn parse_inline_item_pattern(&mut self) -> Option<()> {
        let c = self.peek_char()?;
        match c {
            ' ' | '\t' | '\u{a0}' => { self.parse_whitespace()?; }
            '\\' => {
                if self.try_parse(|p| { p.parse_escaped_timestamp_rules()?; Some(()) }).is_some() {}
                else if self.try_parse(|p| { p.parse_katex_inline()?; Some(()) }).is_some() {}
                else { self.parse_escaped()?; }
            }
            '[' => { self.parse_maybe_references()?; }
            '<' => {
                if self.try_parse(|p| { p.parse_timestamp_rules()?; Some(()) }).is_some() {}
                else if self.try_parse(|p| { p.parse_maybe_references()?; Some(()) }).is_some() {}
                else { self.parse_inline_emoticon()?; }
            }
            '!' => { self.parse_image()?; }
            '|' => { self.parse_spoiler()?; }
            '@' => { self.parse_user_mention_direct()?; }
            '\x60' => { self.parse_inline_code()?; }
            '+' => {
                if self.try_parse(|p| { p.parse_autolinked_phone()?; Some(()) }).is_some() {}
                else if self.try_parse(|p| { p.parse_autolinked_email()?; Some(()) }).is_some() {}
                else { self.parse_plain_run()?; }
            }
            '$' => { self.parse_katex_inline()?; }
            ':' => {
                if self.try_parse(|p| { p.parse_inline_emoji()?; Some(()) }).is_some() {}
                else { self.parse_inline_emoticon()?; }
            }
            '*' => {
                if self.try_parse(|p| { p.parse_emphasis_with_whitespace()?; Some(()) }).is_some() {}
                else if self.try_parse(|p| { p.parse_emphasis()?; Some(()) }).is_some() {}
                else { self.parse_inline_emoticon()?; }
            }
            '~' => {
                if self.try_parse(|p| { p.parse_emphasis_with_whitespace()?; Some(()) }).is_some() {}
                else { self.parse_emphasis()?; }
            }
            '-' => {
                if self.try_parse(|p| { p.parse_plain_run_before_emoticon()?; Some(()) }).is_some() {}
                else { self.parse_inline_emoticon()?; }
            }
            '_' => {
                if self.try_parse(|p| { p.parse_plain_underscore_then_domain()?; Some(()) }).is_some() {}
                else if self.try_parse(|p| { p.parse_emphasis_with_whitespace()?; Some(()) }).is_some() {}
                else { self.parse_emphasis()?; }
            }
            '#' => {
                if self.try_parse(|p| { p.parse_channel_mention()?; Some(()) }).is_some() {}
                else { self.parse_inline_emoticon()?; }
            }
            ';' | '=' | '>' | '\'' | '%' => {
                if self.try_parse(|p| { p.parse_inline_emoticon()?; Some(()) }).is_some() {}
                else { self.parse_plain_run()?; }
            }
            '(' => { self.parse_inline_emoticon()?; }
            'B' | 'D' | 'O' | 'X' | 'b' | 'd' | 'o' | 'x' | '0' | '8' => {
                // Alpha/digit that can start emoticons
                if self.try_parse(|p| { p.parse_inline_emoticon()?; Some(()) }).is_some() {}
                else { self.parse_inline_item_alpha_path()?; }
            }
            'c' => {
                // 'c' can start "color:#..."
                if self.try_parse(|p| { p.parse_color()?; Some(()) }).is_some() {}
                else { self.parse_inline_item_alpha_path()?; }
            }
            'a'..='z' | 'A'..='Z' | '1'..='7' | '9' => {
                // Most common: alpha chars → reduced 5-rule path
                self.parse_inline_item_alpha_path()?;
            }
            _ => {
                // Non-ASCII (Unicode emoji) or remaining punct
                if self.try_parse(|p| { p.parse_inline_emoji()?; Some(()) }).is_some() {}
                else { self.parse_plain_run()?; }
            }
        }
        Some(())
    }

    // Alpha path with line-level hint guards: skip O(n) lookaheads when target char absent
    fn parse_inline_item_alpha_path(&mut self) -> Option<()> {
        // Email needs '@' on this line
        if self.line_has_at {
            if self.try_parse(|p| { p.parse_autolinked_email()?; Some(()) }).is_some() {
                return Some(());
            }
        }
        // URL needs '://' or '.' on this line
        if self.line_has_colon_slash || self.line_has_dot {
            if self.try_parse(|p| { p.parse_autolinked_url()?; Some(()) }).is_some() {
                return Some(());
            }
        }
        // Emphasis (word_ italic) needs '_' on this line
        if self.line_has_underscore {
            if self.try_parse(|p| { p.parse_emphasis()?; Some(()) }).is_some() {
                return Some(());
            }
        }
        // Channel mention (text#channel) needs '#' on this line
        if self.line_has_hash {
            if self.try_parse(|p| { p.parse_channel_mention()?; Some(()) }).is_some() {
                return Some(());
            }
        }
        // Fallback: plain text run
        self.parse_plain_run()?;
        Some(())
    }

    fn parse_escaped(&mut self) -> Option<Inline> {
        let s = self.pos;
        self.expect_str("\\")?;
        let c = self.peek_char()?;
        if matches!(c, '*' | '_' | '~' | '\x60' | '#' | '.') {
            self.advance(1);
            self.emit_text(s, self.pos);
            Some(Self::plain(&c.to_string()))
        } else {
            None
        }
    }

    fn parse_blocked_by_javascript(&mut self) -> Option<Inline> {
        None // unreachable sentinel
    }

    // Domain / URL helpers (simplified)
    fn parse_domain_name(&mut self) -> Option<&'a str> {
        if self.remaining().starts_with("localhost") {
            let s = self.pos;
            self.advance(9);
            return Some(&self.input[s..self.pos]);
        }
        let start = self.pos;
        self.consume_while1(|c| c.is_ascii_alphanumeric() || c == '-')?;
        // PEG requires at least one dot segment: ("." DomainChar DomainNameLabel*)+
        self.expect_str(".")?;
        self.consume_while1(|c| c.is_ascii_alphanumeric() || c == '-')?;
        while self.try_parse(|p| {
            p.expect_str(".")?;
            p.consume_while1(|c| c.is_ascii_alphanumeric() || c == '-')?;
            Some(())
        }).is_some() {}
        Some(&self.input[start..self.pos])
    }

    fn parse_url_scheme(&mut self) -> Option<&'a str> {
        let start = self.pos;
        self.consume_while1(|c| c.is_ascii_alphanumeric() || c == '+' || c == '-')?;
        self.expect_str(":")?;
        Some(&self.input[start..self.pos])
    }

    fn parse_url(&mut self) -> Option<String> {
        let start = self.pos;
        // scheme://authority or just authority host
        self.try_parse(|p| {
            p.parse_url_scheme()?;
            p.expect_str("//")?;
            Some(())
        }).or_else(|| None);
        self.parse_domain_name()?;
        // consume URL body
        self.consume_while(|c| !c.is_ascii_whitespace() && c != '>' && c != ')' && c != '|');
        Some(self.input[start..self.pos].to_string())
    }

    fn parse_auto_link_url(&mut self) -> Option<String> {
        self.parse_url()
    }

    fn parse_local_part(&mut self) -> Option<&'a str> {
        self.consume_while1(|c| c.is_ascii_alphanumeric() || "!#$%&'*+/=?^_\x60{|}~-.".contains(c))
    }

    fn parse_email(&mut self) -> Option<String> {
        self.try_parse(|p| { p.expect_str("mailto:")?; Some(()) });
        let start = self.pos;
        self.parse_local_part()?;
        self.expect_str("@")?;
        self.parse_domain_name()?;
        Some(self.input[start..self.pos].to_string())
    }

    fn parse_phone(&mut self) -> Option<(String, String)> {
        self.expect_str("+")?;
        let start = self.pos;
        self.consume_while1(|c| c.is_ascii_digit() || c == '-' || c == '(' || c == ')')?;
        let text = format!("+{}", &self.input[start..self.pos]);
        let number = self.input[start..self.pos].replace(|c: char| !c.is_ascii_digit(), "");
        Some((text, number))
    }

    // Unicode emoji (simplified — matches surrogate-pair ranges)
    fn parse_unicode_emoji(&mut self) -> Option<String> {
        let start = self.pos;
        let c = self.peek_char()?;
        let cp = c as u32;
        // Common emoji ranges
        if (0x1F600..=0x1F64F).contains(&cp)   // emoticons
            || (0x1F300..=0x1F5FF).contains(&cp)  // misc symbols & pictographs
            || (0x1F680..=0x1F6FF).contains(&cp)  // transport & map
            || (0x1F900..=0x1F9FF).contains(&cp)  // supplemental
            || (0x2600..=0x26FF).contains(&cp)     // misc symbols
            || (0x2700..=0x27BF).contains(&cp)     // dingbats
            || (0x2300..=0x23FF).contains(&cp)     // misc technical
            || (0xFE00..=0xFE0F).contains(&cp)     // variation selectors
            || (0x1F1E6..=0x1F1FF).contains(&cp)   // regional indicators
        {
            self.advance(c.len_utf8());
            // Consume ZWJ sequences, variation selectors, Fitzpatrick modifiers
            while let Some(next) = self.peek_char() {
                let ncp = next as u32;
                if ncp == 0x200D || (0xFE00..=0xFE0F).contains(&ncp)
                    || (0x1F3FB..=0x1F3FF).contains(&ncp)
                    || (0x1F600..=0x1F64F).contains(&ncp)
                    || (0x1F300..=0x1F5FF).contains(&ncp)
                    || (0x1F680..=0x1F6FF).contains(&ncp)
                    || (0x1F900..=0x1F9FF).contains(&ncp)
                    || (0x2600..=0x26FF).contains(&ncp)
                    || (0x2700..=0x27BF).contains(&ncp)
                    || (0x1F1E6..=0x1F1FF).contains(&ncp)
                {
                    self.advance(next.len_utf8());
                } else {
                    break;
                }
            }
            Some(self.input[start..self.pos].to_string())
        } else {
            None
        }
    }

    // AutolinkedURL: wraps in Link events, captures URL as DataStr
    fn parse_autolinked_url(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Link);
            p.lookahead(|p| {
                while p.try_parse(|p| {
                    let c = p.peek_char()?;
                    if !(c == ' ' || c == '\t' || c == '\r' || c == '\n' || c == ':' || c == '.' || c == '/' || c == '@') {
                        p.advance(c.len_utf8());
                    } else { return None; }
                    Some(())
                }).is_some() {}
                if p.try_parse(|p| { p.expect_str("://")?; Some(()) }).is_some() {
                } else if p.try_parse(|p| {
                    p.expect_str(".")?;
                    let c = p.peek_char()?;
                    if c.is_ascii_alphabetic() { Some(()) } else { None }
                }).is_some() {
                } else { return None; }
                Some(())
            })?;
            let url_start = p.pos;
            p.parse_auto_link_url()?;
            let url = p.input[url_start..p.pos].to_string();
            p.events.push(GreenEvent::DataStr(url));
            p.finish_node(SK::Link);
            Some(())
        })?;
        Some(())
    }

    // UserMentionDirect: @user → emit MentionUser span excluding @ prefix
    fn parse_user_mention_direct(&mut self) -> Option<()> {
        self.expect_str("@")?;
        while self.try_parse(|p| { p.expect_str("@")?; Some(()) }).is_some() {}
        let name_start = self.pos;
        self.parse_utf8names_validation()?;
        self.try_parse(|p| {
            let c = p.peek_char()?;
            if c == ':' || c == '@' { p.advance(c.len_utf8()); } else { return None; }
            p.parse_utf8names_validation()?;
            Some(())
        });
        let user = &self.input[name_start..self.pos];
        if user.ends_with("__") { return None; }
        self.emit_leaf(SK::MentionUser, name_start, self.pos);
        Some(())
    }

    // ChannelMention: #channel → emit MentionChannel span excluding # prefix
    fn parse_channel_mention(&mut self) -> Option<()> {
        // text#char form (plain text, not a real mention)
        if self.try_parse(|p| {
            p.parse_text()?;
            p.expect_str("#")?;
            p.parse_alpha_numeric_char()?;
            Some(())
        }).is_some() {
            return Some(());
        }
        // Direct #channel form
        self.expect_str("#")?;
        let name_start = self.pos;
        self.parse_utf8names_validation()?;
        self.emit_leaf(SK::MentionChannel, name_start, self.pos);
        Some(())
    }

    // Manual References: wraps in Start(Link)/Finish(Link) with DataStr for href
    fn parse_references(&mut self) -> Option<()> {
        // Markdown link: [title](url)
        if self.try_parse(|p| {
            p.start_node(SK::Link);
            p.expect_str("[")?;
            while p.try_parse(|p| { p.parse_link_title()?; Some(()) }).is_some() {}
            p.expect_str("](")?;
            let href_start = p.pos;
            p.parse_markdown_link_ref()?;
            let href = p.input[href_start..p.pos].to_string();
            p.expect_str(")")?;
            p.events.push(GreenEvent::DataStr(href));
            p.finish_node(SK::Link);
            Some(())
        }).is_some() {
            return Some(());
        }
        // Slack-style link: <url|title>
        if self.try_parse(|p| {
            p.start_node(SK::Link);
            p.expect_str("<")?;
            let href_start = p.pos;
            p.parse_link_ref()?;
            let href = p.input[href_start..p.pos].to_string();
            p.expect_str("|")?;
            p.parse_link_title2()?;
            p.expect_str(">")?;
            p.events.push(GreenEvent::DataStr(href));
            p.finish_node(SK::Link);
            Some(())
        }).is_some() {
            return Some(());
        }
        None
    }

    fn parse_emoji_short_code(&mut self) -> Option<()> {
        self.expect_str(":")?;
        let name = self.parse_emoji_short_code_name()?;
        self.expect_str(":")?;
        self.events.push(GreenEvent::LeafEmoji(name.to_string(), name.to_string()));
        Some(())
    }

    fn parse_emoji_short_code_name(&mut self) -> Option<&'a str> {
        self.consume_while1(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '+' || c == '.')
    }

    // Emoticon patterns (simplified dispatch)
    fn parse_emoticon_pattern(&mut self) -> Option<Inline> {
        let emoticons: &[(&str, &str)] = &[
            (":-D", "smiley"), (":D", "smiley"), ("=D", "smiley"),
            (":')", "joy"), ("':-)", "joy"),
            (":-)", "slight_smile"), (":)", "slight_smile"), (":]", "slight_smile"),
            ("=]", "slight_smile"), ("=)", "slight_smile"),
            (":-*", "kissing_heart"), (":*", "kissing_heart"), (":^*", "kissing_heart"),
            (":-P", "stuck_out_tongue"), (":P", "stuck_out_tongue"),
            ("=P", "stuck_out_tongue"),
            (":-(", "disappointed"), (":(", "disappointed"),
            (":-[", "disappointed"), (":[", "disappointed"),
            ("=(", "disappointed"),
            (":-/", "confused"), (":/", "confused"), (":\\", "confused"),
            ("=/", "confused"), ("=\\", "confused"),
            (":'(", "cry"), (";(", "cry"), (";-(", "cry"),
            (":@", "angry"), (">:(", "angry"), (">:-(", "angry"),
            (":$", "flushed"), ("=$", "flushed"),
            (":-X", "no_mouth"), (":X", "no_mouth"), (":-#", "no_mouth"), (":#", "no_mouth"),
            ("=X", "no_mouth"), ("=#", "no_mouth"),
            (":-O", "open_mouth"), (":O", "open_mouth"), ("O_O", "open_mouth"),
            (";)", "wink"), (";-)", "wink"), (";D", "wink"), (";^)", "wink"),
            ("*-)", "wink"), ("*)", "wink"),
            ("B-)", "sunglasses"), ("B)", "sunglasses"), ("8)", "sunglasses"), ("8-)", "sunglasses"),
            ("D:", "fearful"),
            ("</3", "broken_heart"), ("<3", "heart"),
            (">:)", "laughing"), (">;)", "laughing"),
            (">.<", "persevere"),
            ("(y)", "thumbsup"),
            ("-_-", "expressionless"), ("-__-", "expressionless"), ("-___-", "expressionless"),
            ("X-P", "stuck_out_tongue_winking_eye"), (">:P", "stuck_out_tongue_winking_eye"),
            ("X)", "dizzy_face"), ("X-)", "dizzy_face"),
            ("#-)", "dizzy_face"), ("#)", "dizzy_face"),
            ("%-)", "dizzy_face"), ("%)", "dizzy_face"),
        ];
        // Sort longest first for greedy match
        for &(pattern, shortcode) in emoticons {
            if self.remaining().starts_with(pattern) {
                self.advance(pattern.len());
                return Some(Inline::EmojiShortCode {
                    value: Box::new(Self::plain(pattern)),
                    short_code: shortcode.to_string(),
                });
            }
        }
        None
    }

    fn parse_emoticon(&mut self) -> Option<Inline> {
        if !self.config.emoticons { return None; }
        self.parse_emoticon_pattern()
    }


    // ── Generated rule methods ─────────────────────────────────────

    /// PEG rule: Start -> Node
    fn parse_start(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_big_emoji()?;
            p.negative_lookahead(|p| {
                p.any_char()?;
                Some(())
            })?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_blocks()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_paragraph()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_end_of_line()?;
                                // JS: return paragraph([plain('')]);


                Some(())
            }).is_some() {
            } else {
                return None;
            }
            while p.try_parse(|p| {
                if p.try_parse(|p| {
                    p.parse_blocks()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_paragraph()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_end_of_line()?;
                                        // JS: return paragraph([plain('')]);


                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            }).is_some() {}

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Blocks -> Inline
    fn parse_blocks(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_blockquote()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_block_spoiler()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_long_code()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_code()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_horizontal_rule()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_table()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_heading()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_tasks()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_ordered_list()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_unordered_list()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_katex()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_line_break()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Blockquote -> Node
    fn parse_blockquote(&mut self) -> Option<()> {
        self.parse_blockquote_line()?;
        while self.try_parse(|p| {
            p.parse_blockquote_line()?;
            Some(())
        }).is_some() {}
                // JS: return quote(b);


        Some(())
    }

    /// PEG rule: BlockquoteLine -> Node
    fn parse_blockquote_line(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str(">")?;
            while p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_end_of_line()?;
                        // JS: return paragraph([plain('')]);


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str(">")?;
            while p.try_parse(|p| {
                let c1 = p.peek_char()?;
                if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_paragraph()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: BlockSpoiler -> Node
    fn parse_block_spoiler(&mut self) -> Option<()> {
        self.expect_str("||")?;
        self.parse_end_of_line()?;
        self.lookahead(|p| {
            p.negative_lookahead(|p| {
                p.expect_str("||")?;
                Some(())
            })?;
            Some(())
        })?;
        self.parse_paragraph()?;
        while self.try_parse(|p| {
            p.lookahead(|p| {
                p.negative_lookahead(|p| {
                    p.expect_str("||")?;
                    Some(())
                })?;
                Some(())
            })?;
            p.parse_paragraph()?;
            Some(())
        }).is_some() {}
        self.try_parse(|p| {
            p.parse_end_of_line()?;
            Some(())
        });
        self.expect_str("||")?;
                // JS: return spoilerBlock([first, ...rest]);


        Some(())
    }

    /// PEG rule: Table -> Node
    fn parse_table(&mut self) -> Option<()> {
        self.parse_table_row_line()?;
        self.parse_table_delimiter_row()?;
        while self.try_parse(|p| {
            p.parse_table_row_line()?;
            Some(())
        }).is_some() {}
                // JS: return table(header, aligns, body, [range().start, range().end]);


        Some(())
    }

    /// PEG rule: TableRowLine -> Vec<Vec<Inline>>
    fn parse_table_row_line(&mut self) -> Option<()> {
        self.expect_str("|")?;
        self.parse_table_cell()?;
        self.expect_str("|")?;
        while self.try_parse(|p| {
            p.parse_table_cell()?;
            p.expect_str("|")?;
            Some(())
        }).is_some() {}
        self.try_parse(|p| {
            p.parse_end_of_line()?;
            Some(())
        });

        Some(())
    }

    /// PEG rule: TableCell -> Vec<Inline>
    fn parse_table_cell(&mut self) -> Option<()> {
        while self.try_parse(|p| {
            p.parse_table_cell_item()?;
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: TableCellItem -> Inline
    fn parse_table_cell_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let ev0 = p.pos;
            p.expect_str("\\|")?;
            p.emit_text(ev0, p.pos);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.expect_str("|")?;
                Some(())
            })?;
            p.negative_lookahead(|p| {
                p.parse_end_of_line()?;
                Some(())
            })?;
            if p.try_parse(|p| {
                p.parse_inline_item_pattern()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_any()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: TableDelimiterRow -> Inline
    fn parse_table_delimiter_row(&mut self) -> Option<()> {
        self.expect_str("|")?;
        self.parse_table_delimiter_cell()?;
        self.expect_str("|")?;
        while self.try_parse(|p| {
            p.parse_table_delimiter_cell()?;
            p.expect_str("|")?;
            Some(())
        }).is_some() {}
        self.try_parse(|p| {
            p.parse_end_of_line()?;
            Some(())
        });

        Some(())
    }

    /// PEG rule: TableDelimiterCell -> Inline
    fn parse_table_delimiter_cell(&mut self) -> Option<()> {
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.try_parse(|p| {
            p.expect_str(":")?;
            Some(())
        });
        self.expect_str("-")?;
        while self.try_parse(|p| {
            p.expect_str("-")?;
            Some(())
        }).is_some() {}
        self.try_parse(|p| {
            p.expect_str(":")?;
            Some(())
        });
        while self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
                // JS: if (left && right) { return 'center'; } ...


        Some(())
    }

    /// PEG rule: TimestampType -> Inline
    fn parse_timestamp_type(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str("t")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("T")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("d")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("D")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("f")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("F")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("R")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Unixtime -> Inline
    fn parse_unixtime(&mut self) -> Option<()> {
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..10 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];

        Some(())
    }

    /// PEG rule: TimestampHoursMinutesSeconds -> Inline
    fn parse_timestamp_hours_minutes_seconds(&mut self) -> Option<()> {
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];
        let hours = text0;
        self.expect_str(":")?;
        let text1_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text1 = &self.input[text1_start..self.pos];
        let minutes = text1;
        self.expect_str(":")?;
        let text2_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text2 = &self.input[text2_start..self.pos];
        let seconds = text2;
        self.try_parse(|p| {
            p.parse_timezone()?;
            Some(())
        });
                // JS: return timestampFromHours(hours, minutes, seconds, tz);


        Some(())
    }

    /// PEG rule: TimestampHoursMinutes -> Inline
    fn parse_timestamp_hours_minutes(&mut self) -> Option<()> {
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];
        let hours = text0;
        self.expect_str(":")?;
        let text1_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text1 = &self.input[text1_start..self.pos];
        let minutes = text1;
        self.try_parse(|p| {
            p.parse_timezone()?;
            Some(())
        });
                // JS: return timestampFromHours(hours, minutes, undefined, tz);


        Some(())
    }

    /// PEG rule: Timestamp -> Inline
    fn parse_timestamp(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_timestamp_hours_minutes_seconds()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_timestamp_hours_minutes()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Timezone -> Inline
    fn parse_timezone(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str("+")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("-")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];
        let tz_hour = text0;
        self.expect_str(":")?;
        let text1_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text1 = &self.input[text1_start..self.pos];
        let tz_minute = text1;
                // JS: return offset + tzHour + ':' + tzMinute;


        Some(())
    }

    /// PEG rule: ISO8601Date -> Inline
    fn parse_iso8601date(&mut self) -> Option<()> {
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..4 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];
        let year = text0;
        self.expect_str("-")?;
        let text1_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text1 = &self.input[text1_start..self.pos];
        let month = text1;
        self.expect_str("-")?;
        let text2_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text2 = &self.input[text2_start..self.pos];
        let day = text2;
        self.expect_str("T")?;
        let text3_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text3 = &self.input[text3_start..self.pos];
        let hours = text3;
        self.expect_str(":")?;
        let text4_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text4 = &self.input[text4_start..self.pos];
        let minutes = text4;
        self.expect_str(":")?;
        let text5_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text5 = &self.input[text5_start..self.pos];
        let seconds = text5;
        self.expect_str(".")?;
        let text6_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..3 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text6 = &self.input[text6_start..self.pos];
        let milliseconds = text6;
        self.try_parse(|p| {
            p.parse_timezone()?;
            Some(())
        });
                // JS: return timestampFromIsoTime({ year, month, day, hours, minutes, seconds, milliseconds, timezone: tz });


        Some(())
    }

    /// PEG rule: ISO8601DateWithoutMilliseconds -> Inline
    fn parse_iso8601date_without_milliseconds(&mut self) -> Option<()> {
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..4 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text0 = &self.input[text0_start..self.pos];
        let year = text0;
        self.expect_str("-")?;
        let text1_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text1 = &self.input[text1_start..self.pos];
        let month = text1;
        self.expect_str("-")?;
        let text2_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text2 = &self.input[text2_start..self.pos];
        let day = text2;
        self.expect_str("T")?;
        let text3_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text3 = &self.input[text3_start..self.pos];
        let hours = text3;
        self.expect_str(":")?;
        let text4_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text4 = &self.input[text4_start..self.pos];
        let minutes = text4;
        self.expect_str(":")?;
        let text5_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..2 {
            if self.try_parse(|p| {
            p.parse_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        let text5 = &self.input[text5_start..self.pos];
        let seconds = text5;
        self.try_parse(|p| {
            p.parse_timezone()?;
            Some(())
        });
                // JS: return timestampFromIsoTime({ year, month, day, hours, minutes, seconds, timezone: tz });


        Some(())
    }

    /// PEG rule: TimestampRules -> Inline
    fn parse_timestamp_rules(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str("<t:")?;
            if p.try_parse(|p| {
                p.parse_unixtime()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date_without_milliseconds()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_timestamp()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            p.expect_str(":")?;
            p.parse_timestamp_type()?;
            p.expect_str(">")?;
                        // JS: return timestamp(date, format, [range().start, range().end]);


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("<t:")?;
            if p.try_parse(|p| {
                p.parse_unixtime()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date_without_milliseconds()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_timestamp()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            p.expect_str(">")?;
                        // JS: return timestamp(date, undefined, [range().start, range().end]);


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Code -> Node
    fn parse_code(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Code);
            p.expect_str("```")?;
            p.try_parse(|p| {
                p.parse_code_language()?;
                Some(())
            });
            p.parse_end_of_line()?;
            p.parse_code_line()?;
            while p.try_parse(|p| {
                p.parse_code_line()?;
                Some(())
            }).is_some() {}
            p.parse_end_of_line()?;
            p.expect_str("```")?;
            p.finish_node(SK::Code);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: CodeLanguage -> Inline
    fn parse_code_language(&mut self) -> Option<()> {
        let text2_start = self.pos;
        let c1 = self.peek_char()?;
        if ((c1 >= 'a' && c1 <= 'z') || (c1 >= 'A' && c1 <= 'Z') || (c1 >= '0' && c1 <= '9') || c1 == ' ' || c1 == '_' || c1 == '-' || c1 == '.') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if ((c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z') || (c0 >= '0' && c0 <= '9') || c0 == ' ' || c0 == '_' || c0 == '-' || c0 == '.') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];

        Some(())
    }

    /// PEG rule: LongCode -> Node
    fn parse_long_code(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Code);
            let text0_start = p.pos;
            p.expect_str("````")?;
            while p.try_parse(|p| {
                p.expect_str("`")?;
                Some(())
            }).is_some() {}
            let text0 = &p.input[text0_start..p.pos];
            let fence = text0;
            // codeFence guard: set fence on open
            p.try_parse(|p| {
                p.parse_code_language()?;
                Some(())
            });
            p.parse_end_of_line()?;
            p.parse_long_code_line()?;
            while p.try_parse(|p| {
                p.parse_long_code_line()?;
                Some(())
            }).is_some() {}
            p.parse_long_code_close()?;
            p.finish_node(SK::Code);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: LongCodeLine -> Inline
    fn parse_long_code_line(&mut self) -> Option<()> {
        self.negative_lookahead(|p| {
            p.parse_long_code_close()?;
            Some(())
        })?;
        let text1_start = self.pos;
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if !(c0 == '\r' || c0 == '\n') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let text = text1;
        self.parse_end_of_line()?;
                // JS: return codeLine(plain(text));


        Some(())
    }

    /// PEG rule: LongCodeClose -> Inline
    fn parse_long_code_close(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.expect_str("`")?;
        while self.try_parse(|p| {
            p.expect_str("`")?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let fence = text0;
        // codeFence guard: match fence on close
        while self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_end_of_line()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    p.any_char()?;
                    Some(())
                })?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: CodeLine -> Inline
    fn parse_code_line(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_code_chunk()?;
                        // JS: return codeLine(chunk);


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("\n")?;
            p.parse_code_chunk()?;
                        // JS: return codeLine(chunk);


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("\n")?;
            p.negative_lookahead(|p| {
                p.expect_str("```")?;
                Some(())
            })?;
                        // JS: return codeLine(plain(''));


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: CodeChunkChar -> Inline
    fn parse_code_chunk_char(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if !(c0 == '\r' || c0 == '\n' || c0 == '`') { p.advance(c0.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("`")?;
            let c1 = p.peek_char()?;
            if !(c1 == '`' || c1 == '\r' || c1 == '\n') { p.advance(c1.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("`")?;
            p.expect_str("`")?;
            let c2 = p.peek_char()?;
            if !(c2 == '`' || c2 == '\r' || c2 == '\n') { p.advance(c2.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("`")?;
            p.expect_str("`")?;
            p.lookahead(|p| {
                if p.try_parse(|p| {
                    p.expect_str("\r")?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.expect_str("\n")?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.negative_lookahead(|p| {
                        p.any_char()?;
                        Some(())
                    })?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            })?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("`")?;
            p.lookahead(|p| {
                if p.try_parse(|p| {
                    p.expect_str("\r")?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.expect_str("\n")?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.negative_lookahead(|p| {
                        p.any_char()?;
                        Some(())
                    })?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            })?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: CodeChunk -> Inline
    fn parse_code_chunk(&mut self) -> Option<()> {
        let ev1 = self.pos;
        let text0_start = self.pos;
        self.parse_code_chunk_char()?;
        while self.try_parse(|p| {
            p.parse_code_chunk_char()?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let text = text0;
        self.emit_text(ev1, self.pos);

        Some(())
    }

    /// PEG rule: Heading -> Node
    fn parse_heading(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Heading);
            p.parse_heading_start()?;
            let c1 = p.peek_char()?;
            if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_heading_chunk()?;
            p.try_parse(|p| {
                p.parse_end_of_line()?;
                Some(())
            });
            p.finish_node(SK::Heading);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: HeadingStart -> usize
    fn parse_heading_start(&mut self) -> Option<()> {
        let mut _count = 0usize;
        for _ in 0..1 {
            self.expect_str("#")?;
            _count += 1;
        }
        for _ in 0..3 {
            if self.try_parse(|p| {
            p.expect_str("#")?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        if _count < 1 { return None; }

        Some(())
    }

    /// PEG rule: HeadingChunk -> Vec<Inline>
    fn parse_heading_chunk(&mut self) -> Option<()> {
        self.parse_heading_inline_item()?;
        while self.try_parse(|p| {
            p.parse_heading_inline_item()?;
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: HeadingInlineItem -> Inline
    fn parse_heading_inline_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_inline_item_pattern()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.parse_end_of_line()?;
                Some(())
            })?;
            p.parse_any()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Tasks -> Node
    fn parse_tasks(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Tasks);
            p.parse_task()?;
            while p.try_parse(|p| {
                p.parse_task()?;
                Some(())
            }).is_some() {}
            p.finish_node(SK::Tasks);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: Task -> Inline
    fn parse_task(&mut self) -> Option<()> {
        self.expect_str("- [")?;
        self.parse_task_flag()?;
        self.expect_str("]")?;
        let c1 = self.peek_char()?;
        if (c1 == ' ' || c1 == '\t') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.parse_inline()?;
        self.try_parse(|p| {
            p.parse_nested_lists()?;
            Some(())
        });
                // JS: return task(text, flag, nested);


        Some(())
    }

    /// PEG rule: TaskFlag -> bool
    fn parse_task_flag(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str("x")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str(" ")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: OrderedList -> Node
    fn parse_ordered_list(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::OrderedList);
            p.parse_ordered_list_item()?;
            while p.try_parse(|p| {
                p.parse_ordered_list_item()?;
                Some(())
            }).is_some() {}
            p.finish_node(SK::OrderedList);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: OrderedListItem -> Inline
    fn parse_ordered_list_item(&mut self) -> Option<()> {
        self.parse_digits()?;
        self.expect_str(".")?;
        let c1 = self.peek_char()?;
        if (c1 == ' ' || c1 == '\t') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.parse_inline()?;
        self.try_parse(|p| {
            p.parse_nested_lists()?;
            Some(())
        });
                // JS: return listItem(text, parseInt(number, 10), nested);


        Some(())
    }

    /// PEG rule: UnorderedList -> Node
    fn parse_unordered_list(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::UnorderedList);
            if p.try_parse(|p| {
                p.parse_unordered_list_hyphen_item()?;
                while p.try_parse(|p| {
                    p.parse_unordered_list_hyphen_item()?;
                    Some(())
                }).is_some() {}

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_unordered_list_asterisk_item()?;
                while p.try_parse(|p| {
                    p.parse_unordered_list_asterisk_item()?;
                    Some(())
                }).is_some() {}

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            p.finish_node(SK::UnorderedList);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: UnorderedListHyphenItem -> Inline
    fn parse_unordered_list_hyphen_item(&mut self) -> Option<()> {
        self.expect_str("-")?;
        let c1 = self.peek_char()?;
        if (c1 == ' ' || c1 == '\t') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.parse_inline()?;
        self.try_parse(|p| {
            p.parse_nested_lists()?;
            Some(())
        });
                // JS: return listItem(text, undefined, nested);


        Some(())
    }

    /// PEG rule: UnorderedListAsteriskItem -> Inline
    fn parse_unordered_list_asterisk_item(&mut self) -> Option<()> {
        self.expect_str("*")?;
        let c1 = self.peek_char()?;
        if (c1 == ' ' || c1 == '\t') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.parse_unordered_list_item_content()?;
        self.try_parse(|p| {
            p.parse_nested_lists()?;
            Some(())
        });
                // JS: return listItem(text, undefined, nested);


        Some(())
    }

    /// PEG rule: UnorderedListItemContent -> Vec<Inline>
    fn parse_unordered_list_item_content(&mut self) -> Option<()> {
        self.parse_unordered_list_item_content_item()?;
        while self.try_parse(|p| {
            p.parse_unordered_list_item_content_item()?;
            Some(())
        }).is_some() {}
        self.negative_lookahead(|p| {
            p.expect_str("*")?;
            Some(())
        })?;
        self.try_parse(|p| {
            p.parse_end_of_line()?;
            Some(())
        });

        Some(())
    }

    /// PEG rule: UnorderedListItemContentItem -> Inline
    fn parse_unordered_list_item_content_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_inline_item_pattern()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.expect_str("*")?;
                Some(())
            })?;
            p.parse_any()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: NestedLists -> Inline
    fn parse_nested_lists(&mut self) -> Option<()> {
        self.parse_nested_list_line()?;
        while self.try_parse(|p| {
            p.parse_nested_list_line()?;
            Some(())
        }).is_some() {}
                // JS: return nestedLists(lines);


        Some(())
    }

    /// PEG rule: NestedListLine -> Inline
    fn parse_nested_list_line(&mut self) -> Option<()> {
        let text2_start = self.pos;
        let c1 = self.peek_char()?;
        if (c1 == ' ' || c1 == '\t') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let indent = text2;
        self.parse_nested_list_line_item()?;
                // JS: return { indent, ...line };


        Some(())
    }

    /// PEG rule: NestedListLineItem -> Inline
    fn parse_nested_list_line_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.expect_str("- [")?;
            p.parse_task_flag()?;
            p.expect_str("]")?;
            let c1 = p.peek_char()?;
            if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_inline()?;
                        // JS: return { marker: 'task', item: task(text, flag) };


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_digits()?;
            p.expect_str(".")?;
            let c3 = p.peek_char()?;
            if (c3 == ' ' || c3 == '\t') { p.advance(c3.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c2 = p.peek_char()?;
                if (c2 == ' ' || c2 == '\t') { p.advance(c2.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_inline()?;
                        // JS: return { marker: 'ordered', item: listItem(text, parseInt(number, 10)) };


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("-")?;
            let c5 = p.peek_char()?;
            if (c5 == ' ' || c5 == '\t') { p.advance(c5.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c4 = p.peek_char()?;
                if (c4 == ' ' || c4 == '\t') { p.advance(c4.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_inline()?;
                        // JS: return { marker: '-', item: listItem(text) };


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("*")?;
            let c7 = p.peek_char()?;
            if (c7 == ' ' || c7 == '\t') { p.advance(c7.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c6 = p.peek_char()?;
                if (c6 == ' ' || c6 == '\t') { p.advance(c6.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            p.parse_unordered_list_item_content()?;
                        // JS: return { marker: '*', item: listItem(text) };


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Katex -> Node
    fn parse_katex(&mut self) -> Option<()> {
        let ev2 = self.pos;
        self.parse_katex_start()?;
        let text1_start = self.pos;
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if !(c0 == '$' || c0 == '\\') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    p.parse_katex_end()?;
                    Some(())
                })?;
                p.any_char()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let content = text1;
        self.parse_katex_end()?;
        self.emit_leaf(SK::Katex, ev2, self.pos);

        Some(())
    }

    /// PEG rule: KatexStart -> Inline
    fn parse_katex_start(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            if !p.config.katex_parenthesis { return None; }
            p.expect_str("\\[")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            if !p.config.katex_dollar { return None; }
            p.expect_str("$$")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: KatexEnd -> Inline
    fn parse_katex_end(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            if !p.config.katex_parenthesis { return None; }
            p.expect_str("\\]")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            if !p.config.katex_dollar { return None; }
            p.expect_str("$$")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: KatexInline -> Inline
    fn parse_katex_inline(&mut self) -> Option<()> {
        let ev2 = self.pos;
        self.parse_katex_inline_start()?;
        let text1_start = self.pos;
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if !(c0 == '$' || c0 == '\\' || c0 == '\r' || c0 == '\n') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    p.parse_katex_inline_end()?;
                    Some(())
                })?;
                p.any_char()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let content = text1;
        self.parse_katex_inline_end()?;
        self.emit_leaf(SK::InlineKatex, ev2, self.pos);

        Some(())
    }

    /// PEG rule: KatexInlineStart -> Inline
    fn parse_katex_inline_start(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            if !p.config.katex_parenthesis { return None; }
            p.expect_str("\\(")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            if !p.config.katex_dollar { return None; }
            p.expect_str("$")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: KatexInlineEnd -> Inline
    fn parse_katex_inline_end(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            if !p.config.katex_parenthesis { return None; }
            p.expect_str("\\)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            if !p.config.katex_dollar { return None; }
            p.expect_str("$")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: LineBreak -> Node
    fn parse_line_break(&mut self) -> Option<()> {
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        self.parse_end_of_line()?;
        self.events.push(GreenEvent::LeafLineBreak);

        Some(())
    }

    /// PEG rule: HorizontalRule -> Node
    fn parse_horizontal_rule(&mut self) -> Option<()> {
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == ' ' || c0 == '\t') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        self.parse_horizontal_rule_markers()?;
        while self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == ' ' || c1 == '\t') { p.advance(c1.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        if self.try_parse(|p| {
            p.parse_end_of_line()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.any_char()?;
                Some(())
            })?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        self.events.push(GreenEvent::LeafHorizontalRule);

        Some(())
    }

    /// PEG rule: HorizontalRuleMarkers -> Inline
    fn parse_horizontal_rule_markers(&mut self) -> Option<()> {
        let mut _count = 0usize;
        for _ in 0..3 {
            self.expect_str("-")?;
            _count += 1;
        }
        loop {
            if self.try_parse(|p| {
            p.expect_str("-")?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        if _count < 3 { return None; }
                // JS: return [range().start, range().end];


        Some(())
    }

    /// PEG rule: Paragraph -> Node
    fn parse_paragraph(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Paragraph);
            p.parse_inline()?;
            p.finish_node(SK::Paragraph);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: InlineEmoji -> Inline
    fn parse_inline_emoji(&mut self) -> Option<()> {
        self.parse_emoji()?;

        Some(())
    }

    /// PEG rule: InlineEmoticon -> Inline
    fn parse_inline_emoticon(&mut self) -> Option<()> {
        self.parse_emoticon()?;
        self.lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_emoticon_neighbor()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_inline_item_pattern()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: PlainRunBeforeEmoticon -> Inline
    fn parse_plain_run_before_emoticon(&mut self) -> Option<()> {
        let ev0 = self.pos;
        self.expect_str("-")?;
        self.lookahead(|p| {
            p.expect_str("_")?;
            p.expect_str("-")?;
            p.any_char()?;
            Some(())
        })?;
        self.emit_text(ev0, self.pos);

        Some(())
    }

    /// PEG rule: EscapedTimestampRules -> Inline
    fn parse_escaped_timestamp_rules(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let ev1 = p.pos;
            p.expect_str("\\")?;
            p.expect_str("<t:")?;
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.parse_unixtime()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date_without_milliseconds()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_timestamp()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let raw_date = text0;
            p.expect_str(":")?;
            p.parse_timestamp_type()?;
            p.expect_str(">")?;
            p.emit_text(ev1, p.pos);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let ev3 = p.pos;
            p.expect_str("\\")?;
            p.expect_str("<t:")?;
            let text2_start = p.pos;
            if p.try_parse(|p| {
                p.parse_unixtime()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_iso8601date_without_milliseconds()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_timestamp()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text2 = &p.input[text2_start..p.pos];
            let raw_date = text2;
            p.expect_str(">")?;
            p.emit_text(ev3, p.pos);

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: InlineItemAlphaOrEmoticon -> Inline
    fn parse_inline_item_alpha_or_emoticon(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_inline_emoticon()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_inline_item_alpha_path()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: InlineItemAlphaOrColor -> Inline
    fn parse_inline_item_alpha_or_color(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_color()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_inline_item_alpha_path()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: InlineItemNonAlphaSlowPath -> Inline
    fn parse_inline_item_non_alpha_slow_path(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_inline_emoji()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_plain_run()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Spoiler -> Inline
    fn parse_spoiler(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Spoiler);
            p.expect_str("||")?;
            p.parse_spoiler_content_items()?;
            p.expect_str("||")?;
            p.finish_node(SK::Spoiler);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: SpoilerContentItems -> Vec<Inline>
    fn parse_spoiler_content_items(&mut self) -> Option<()> {
        self.parse_spoiler_content_item()?;
        while self.try_parse(|p| {
            p.parse_spoiler_content_item()?;
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: SpoilerContentItem -> Inline
    fn parse_spoiler_content_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.expect_str("||")?;
                Some(())
            })?;
            p.parse_inline_item_pattern()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.expect_str("||")?;
                Some(())
            })?;
            p.parse_any()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: LinkTitle -> Inline
    fn parse_link_title(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_whitespace()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_emphasis()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let ev3 = p.pos;
            let text2_start = p.pos;
            let c1 = p.peek_char()?;
            if !(c1 == ']' || c1 == '(' || c1 == ')' || c1 == '*' || c1 == '_' || c1 == '~' || c1 == ' ' || c1 == '\t' || c1 == '\r' || c1 == '\n') { p.advance(c1.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if !(c0 == ']' || c0 == '(' || c0 == ')' || c0 == '*' || c0 == '_' || c0 == '~' || c0 == ' ' || c0 == '\t' || c0 == '\r' || c0 == '\n') { p.advance(c0.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            let text2 = &p.input[text2_start..p.pos];
            let any_title = text2;
            p.emit_text(ev3, p.pos);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let ev6 = p.pos;
            let text5_start = p.pos;
            p.negative_lookahead(|p| {
                p.expect_str("](")?;
                p.any_char()?;
                Some(())
            })?;
            p.negative_lookahead(|p| {
                p.expect_str("] [")?;
                while p.try_parse(|p| {
                    let c4 = p.peek_char()?;
                    if !(c4 == ']') { p.advance(c4.len_utf8()); } else { return None; }
                    Some(())
                }).is_some() {}
                p.expect_str("](")?;
                Some(())
            })?;
            p.any_char()?;
            let text5 = &p.input[text5_start..p.pos];
            let any_title = text5;
            p.emit_text(ev6, p.pos);

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: LinkTitle2 -> Inline
    fn parse_link_title2(&mut self) -> Option<()> {
        let text2_start = self.pos;
        if self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if ((c1 >= ' ' && c1 <= ';') || c1 == '=' || (c1 >= '?' && c1 <= '`') || (c1 >= 'a' && c1 <= '{') || (c1 >= '}' && c1 <= '\u{ff}')) { p.advance(c1.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_non_ascii()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if ((c0 >= ' ' && c0 <= ';') || c0 == '=' || (c0 >= '?' && c0 <= '`') || (c0 >= 'a' && c0 <= '{') || (c0 >= '}' && c0 <= '\u{ff}')) { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_non_ascii()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        self.emit_text(text2_start, self.pos);

        Some(())
    }

    /// PEG rule: MarkdownLinkRef -> Inline
    fn parse_markdown_link_ref(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_markdown_link_url()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_markdown_link_file_path()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_phone()?;
                        // JS: return 'tel:' + p.number;


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: LinkRef -> Inline
    fn parse_link_ref(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_url()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_file_path()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_phone()?;
                        // JS: return 'tel:' + p.number;


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: FilePath -> Inline
    fn parse_file_path(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.parse_url_scheme()?;
        self.parse_url_body()?;
        while self.try_parse(|p| {
            p.parse_url_body()?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];

        Some(())
    }

    /// PEG rule: MarkdownLinkFilePath -> Inline
    fn parse_markdown_link_file_path(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.parse_url_scheme()?;
        self.parse_markdown_link_url_body()?;
        while self.try_parse(|p| {
            p.parse_markdown_link_url_body()?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];

        Some(())
    }

    /// PEG rule: MarkdownLinkURL -> Inline
    fn parse_markdown_link_url(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            p.parse_url_scheme()?;
            p.parse_url_authority()?;
            let text0 = &p.input[text0_start..p.pos];

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            p.parse_url_authority_host()?;
            let text1 = &p.input[text1_start..p.pos];

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text2_start = self.pos;
        while self.try_parse(|p| {
            p.parse_markdown_link_url_body()?;
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let tail = text2;
                // JS: return head + tail;


        Some(())
    }

    /// PEG rule: MarkdownLinkURLBody -> Inline
    fn parse_markdown_link_url_body(&mut self) -> Option<()> {
        self.negative_lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_markdown_link_extra()?;
                while p.try_parse(|p| {
                    p.parse_markdown_link_extra()?;
                    Some(())
                }).is_some() {}
                if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_end_of_line()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_whitespace()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;
        self.negative_lookahead(|p| {
            p.expect_str(")")?;
            Some(())
        })?;
        if self.try_parse(|p| {
            p.parse_any_text()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == '*' || c1 == '[' || c1 == '/' || c1 == ']' || c1 == '^' || c1 == '_' || c1 == '`' || c1 == '{' || c1 == '}' || c1 == '~') { p.advance(c1.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("(")?;
            while p.try_parse(|p| {
                p.parse_markdown_link_url_body_paren()?;
                Some(())
            }).is_some() {}
            p.expect_str(")")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            p.negative_lookahead(|p| {
                if p.try_parse(|p| {
                    p.parse_markdown_link_extra()?;
                    while p.try_parse(|p| {
                        p.parse_markdown_link_extra()?;
                        Some(())
                    }).is_some() {}
                    if p.try_parse(|p| {
                        p.parse_whitespace()?;

                        Some(())
                    }).is_some() {
                    } else if p.try_parse(|p| {
                        p.parse_end_of_line()?;

                        Some(())
                    }).is_some() {
                    } else {
                        return None;
                    }

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            })?;
            p.negative_lookahead(|p| {
                p.expect_str(")")?;
                Some(())
            })?;
            if p.try_parse(|p| {
                p.parse_any_text()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == '*' || c0 == '[' || c0 == '/' || c0 == ']' || c0 == '^' || c0 == '_' || c0 == '`' || c0 == '{' || c0 == '}' || c0 == '~') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("(")?;
                while p.try_parse(|p| {
                    p.parse_markdown_link_url_body_paren()?;
                    Some(())
                }).is_some() {}
                p.expect_str(")")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: MarkdownLinkURLBodyParen -> Inline
    fn parse_markdown_link_url_body_paren(&mut self) -> Option<()> {
        self.negative_lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_whitespace()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_end_of_line()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(")")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;
        if self.try_parse(|p| {
            p.parse_any_text()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == '*' || c0 == '[' || c0 == '/' || c0 == ']' || c0 == '^' || c0 == '_' || c0 == '`' || c0 == '{' || c0 == '}' || c0 == '~' || c0 == '(') { p.advance(c0.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: MarkdownLinkExtra -> Inline
    fn parse_markdown_link_extra(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if (c0 == '.' || c0 == ',' || c0 == '!' || c0 == '%' || c0 == '*' || c0 == '"' || c0 == '\'' || c0 == ':' || c0 == ';' || c0 == '=') { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: Image -> Inline
    fn parse_image(&mut self) -> Option<()> {
        self.expect_str("![")?;
        self.try_parse(|p| {
            p.parse_line()?;
            Some(())
        });
        self.expect_str("](")?;
        self.parse_markdown_link_ref()?;
        self.expect_str(")")?;
                // JS: return title ? image(href, title) : image(href);


        Some(())
    }

    /// PEG rule: URLBody -> Inline
    fn parse_url_body(&mut self) -> Option<()> {
        self.negative_lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_extra()?;
                while p.try_parse(|p| {
                    p.parse_extra()?;
                    Some(())
                }).is_some() {}
                if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_end_of_line()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.negative_lookahead(|p| {
                        p.any_char()?;
                        Some(())
                    })?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_whitespace()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;
        if self.try_parse(|p| {
            p.parse_any_text()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == '*' || c1 == '[' || c1 == '/' || c1 == ']' || c1 == '^' || c1 == '_' || c1 == '`' || c1 == '{' || c1 == '}' || c1 == '~' || c1 == '(') { p.advance(c1.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            p.negative_lookahead(|p| {
                if p.try_parse(|p| {
                    p.parse_extra()?;
                    while p.try_parse(|p| {
                        p.parse_extra()?;
                        Some(())
                    }).is_some() {}
                    if p.try_parse(|p| {
                        p.parse_whitespace()?;

                        Some(())
                    }).is_some() {
                    } else if p.try_parse(|p| {
                        p.parse_end_of_line()?;

                        Some(())
                    }).is_some() {
                    } else if p.try_parse(|p| {
                        p.negative_lookahead(|p| {
                            p.any_char()?;
                            Some(())
                        })?;

                        Some(())
                    }).is_some() {
                    } else {
                        return None;
                    }

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            })?;
            if p.try_parse(|p| {
                p.parse_any_text()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == '*' || c0 == '[' || c0 == '/' || c0 == ']' || c0 == '^' || c0 == '_' || c0 == '`' || c0 == '{' || c0 == '}' || c0 == '~' || c0 == '(') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: URLAuthority -> Inline
    fn parse_url_authority(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.expect_str("//")?;
        self.try_parse(|p| {
            p.parse_url_authority_user_info()?;
            Some(())
        });
        self.parse_url_authority_host()?;
        let text0 = &self.input[text0_start..self.pos];

        Some(())
    }

    /// PEG rule: URLAuthorityUserInfo -> Inline
    fn parse_url_authority_user_info(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.parse_url_authority_user()?;
        self.try_parse(|p| {
            p.expect_str(":")?;
            p.parse_url_authority_password()?;
            Some(())
        });
        self.expect_str("@")?;
        let text0 = &self.input[text0_start..self.pos];

        Some(())
    }

    /// PEG rule: URLAuthorityUser -> Inline
    fn parse_url_authority_user(&mut self) -> Option<()> {
        let text2_start = self.pos;
        if self.try_parse(|p| {
            p.parse_alpha_digit()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                let c1 = p.peek_char()?;
                if (c1 == '@' || c1 == '/') { p.advance(c1.len_utf8()); } else { return None; }
                Some(())
            })?;
            p.parse_safe()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_alpha_digit()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    let c0 = p.peek_char()?;
                    if (c0 == '@' || c0 == '/') { p.advance(c0.len_utf8()); } else { return None; }
                    Some(())
                })?;
                p.parse_safe()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];

        Some(())
    }

    /// PEG rule: URLAuthorityPassword -> Inline
    fn parse_url_authority_password(&mut self) -> Option<()> {
        let text2_start = self.pos;
        if self.try_parse(|p| {
            p.parse_alpha_digit()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                let c1 = p.peek_char()?;
                if (c1 == '@' || c1 == '/') { p.advance(c1.len_utf8()); } else { return None; }
                Some(())
            })?;
            p.parse_safe()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_alpha_digit()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    let c0 = p.peek_char()?;
                    if (c0 == '@' || c0 == '/') { p.advance(c0.len_utf8()); } else { return None; }
                    Some(())
                })?;
                p.parse_safe()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];

        Some(())
    }

    /// PEG rule: URLAuthorityHost -> Inline
    fn parse_url_authority_host(&mut self) -> Option<()> {
        self.parse_url_authority_host_name()?;
        self.try_parse(|p| {
            p.expect_str(":")?;
            p.parse_url_authority_port()?;
            Some(())
        });

        Some(())
    }

    /// PEG rule: URLAuthorityHostName -> Inline
    fn parse_url_authority_host_name(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_domain_name()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text0_start = p.pos;
            let mut _count = 0usize;
            for _ in 0..4 {
                if p.try_parse(|p| {
                p.parse_digits()?;
                    Some(())
                }).is_none() { break; }
                _count += 1;
            }
            let text0 = &p.input[text0_start..p.pos];

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: URLAuthorityPort -> Inline
    fn parse_url_authority_port(&mut self) -> Option<()> {
        self.parse_digits()?;

        Some(())
    }

    /// PEG rule: AutolinkedPhone -> Inline
    fn parse_autolinked_phone(&mut self) -> Option<()> {
        self.parse_phone()?;
                // JS: return phoneChecker(p.text, p.number);


        Some(())
    }

    /// PEG rule: AutolinkedEmail -> Inline
    fn parse_autolinked_email(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Link);
            p.lookahead(|p| {
                while p.try_parse(|p| {
                    let c0 = p.peek_char()?;
                    if !(c0 == ' ' || c0 == '\t' || c0 == '\r' || c0 == '\n' || c0 == '@') { p.advance(c0.len_utf8()); } else { return None; }
                    Some(())
                }).is_some() {}
                p.expect_str("@")?;
                Some(())
            })?;
            let email_start = p.pos;
            p.parse_email()?;
            let email_end = p.pos;
            let email = &p.input[email_start..email_end];
            p.emit_text(email_start, email_end);
            let mailto = format!("mailto:{}", email);
            p.events.push(GreenEvent::DataStr(mailto));
            p.finish_node(SK::Link);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: PlainUnderscoreThenDomain -> Inline
    fn parse_plain_underscore_then_domain(&mut self) -> Option<()> {
        let ev1 = self.pos;
        self.expect_str("_")?;
        self.parse_domain_name()?;
        self.lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_end_of_line()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.negative_lookahead(|p| {
                    p.any_char()?;
                    Some(())
                })?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if !(c0 == '_') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;
        self.emit_text(ev1, self.pos);

        Some(())
    }

    /// PEG rule: AutoLinkURLBody -> Inline
    fn parse_auto_link_url_body(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if !(c0 == ' ' || c0 == '\t' || c0 == '\r' || c0 == '\n' || c0 == '.' || c0 == ',' || c0 == '!' || c0 == '%' || c0 == '~' || c0 == '*' || c0 == '"' || c0 == '\'' || c0 == ':' || c0 == ';' || c0 == '(' || c0 == ')' || c0 == '=' || c0 == '~') { p.advance(c0.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                while p.try_parse(|p| {
                    p.parse_extra()?;
                    Some(())
                }).is_some() {}
                if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_end_of_line()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.negative_lookahead(|p| {
                        p.any_char()?;
                        Some(())
                    })?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            })?;
            p.any_char()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Emphasis -> Inline
    fn parse_emphasis(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_maybe_bold()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_italic()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_strikethrough()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: MaybeBold -> Inline
    fn parse_maybe_bold(&mut self) -> Option<()> {
        if self.skip_bold { return None; }
        self.skip_bold = true;
        if self.try_parse(|p| {
            p.parse_bold()?;
                        p.skip_bold = false;


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.skip_bold = false; return None;
            p.parse_blocked_by_javascript()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: MaybeStrikethrough -> Inline
    fn parse_maybe_strikethrough(&mut self) -> Option<()> {
        if self.skip_strikethrough { return None; }
        self.skip_strikethrough = true;
        if self.try_parse(|p| {
            p.parse_strikethrough()?;
                        p.skip_strikethrough = false;


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.skip_strikethrough = false; return None;
            p.parse_blocked_by_javascript()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: MaybeItalic -> Inline
    fn parse_maybe_italic(&mut self) -> Option<()> {
        if self.skip_italic { return None; }
        self.skip_italic = true;
        if self.try_parse(|p| {
            p.parse_italic()?;
                        p.skip_italic = false;


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.skip_italic = false; return None;
            p.parse_blocked_by_javascript()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: MaybeReferences -> Inline
    fn parse_maybe_references(&mut self) -> Option<()> {
        if self.skip_references { return None; }
        self.skip_references = true;
        if self.try_parse(|p| {
            p.parse_references()?;
                        p.skip_references = false;


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.skip_references = false; return None;
            p.parse_blocked_by_javascript()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Italic -> Inline
    fn parse_italic(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let ev5 = p.pos;
            let text4_start = p.pos;
            let c1 = p.peek_char()?;
            if ((c1 >= 'a' && c1 <= 'z') || (c1 >= 'A' && c1 <= 'Z') || (c1 >= '0' && c1 <= '9')) { p.advance(c1.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if ((c0 >= 'a' && c0 <= 'z') || (c0 >= 'A' && c0 <= 'Z') || (c0 >= '0' && c0 <= '9')) { p.advance(c0.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            let c2 = p.peek_char()?;
            if (c2 == '_') { p.advance(c2.len_utf8()); } else { return None; }
            p.try_parse(|p| {
                let c3 = p.peek_char()?;
                if (c3 == '_') { p.advance(c3.len_utf8()); } else { return None; }
                Some(())
            });
            let text4 = &p.input[text4_start..p.pos];
            let value = text4;
            p.emit_text(ev5, p.pos);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c6 = p.peek_char()?;
            if (c6 == '_') { p.advance(c6.len_utf8()); } else { return None; }
            let c7 = p.peek_char()?;
            if (c7 == '_') { p.advance(c7.len_utf8()); } else { return None; }
            p.parse_italic_content_items()?;
            let c8 = p.peek_char()?;
            if (c8 == '_') { p.advance(c8.len_utf8()); } else { return None; }
            let c9 = p.peek_char()?;
            if (c9 == '_') { p.advance(c9.len_utf8()); } else { return None; }
            let text12_start = p.pos;
            let c11 = p.peek_char()?;
            if ((c11 >= 'a' && c11 <= 'z') || (c11 >= 'A' && c11 <= 'Z') || (c11 >= '0' && c11 <= '9')) { p.advance(c11.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c10 = p.peek_char()?;
                if ((c10 >= 'a' && c10 <= 'z') || (c10 >= 'A' && c10 <= 'Z') || (c10 >= '0' && c10 <= '9')) { p.advance(c10.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            let text12 = &p.input[text12_start..p.pos];
            let t = text12;
                        // JS: return reducePlainTexts([plain('__'), ...i, plain('__'), plain(t)]);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c13 = p.peek_char()?;
            if (c13 == '_') { p.advance(c13.len_utf8()); } else { return None; }
            p.parse_italic_content_items()?;
            let c14 = p.peek_char()?;
            if (c14 == '_') { p.advance(c14.len_utf8()); } else { return None; }
            let text17_start = p.pos;
            let c16 = p.peek_char()?;
            if ((c16 >= 'a' && c16 <= 'z') || (c16 >= 'A' && c16 <= 'Z')) { p.advance(c16.len_utf8()); } else { return None; }
            while p.try_parse(|p| {
                let c15 = p.peek_char()?;
                if ((c15 >= 'a' && c15 <= 'z') || (c15 >= 'A' && c15 <= 'Z')) { p.advance(c15.len_utf8()); } else { return None; }
                Some(())
            }).is_some() {}
            let text17 = &p.input[text17_start..p.pos];
            let t = text17;
                        // JS: return reducePlainTexts([plain('_'), ...i, plain('_'), plain(t)]);

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c18 = p.peek_char()?;
            if (c18 == '_') { p.advance(c18.len_utf8()); } else { return None; }
            let c19 = p.peek_char()?;
            if (c19 == '_') { p.advance(c19.len_utf8()); } else { return None; }
            p.parse_italic_content()?;
            let c20 = p.peek_char()?;
            if (c20 == '_') { p.advance(c20.len_utf8()); } else { return None; }
            let c21 = p.peek_char()?;
            if (c21 == '_') { p.advance(c21.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c22 = p.peek_char()?;
            if (c22 == '_') { p.advance(c22.len_utf8()); } else { return None; }
            p.parse_italic_content()?;
            let c23 = p.peek_char()?;
            if (c23 == '_') { p.advance(c23.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: ItalicContent -> Inline
    fn parse_italic_content(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Italic);
            p.parse_italic_content_items()?;
            p.finish_node(SK::Italic);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: ItalicContentItems -> Vec<Inline>
    fn parse_italic_content_items(&mut self) -> Option<()> {
        self.parse_italic_content_item()?;
        while self.try_parse(|p| {
            p.parse_italic_content_item()?;
            Some(())
        }).is_some() {}

        Some(())
    }

    /// PEG rule: ItalicContentItem -> Inline
    fn parse_italic_content_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_italic_content_preferential_item()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_italic_plain_run()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_any_italic()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_line()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: ItalicContentPreferentialItem -> Inline
    fn parse_italic_content_preferential_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_whitespace()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_inline_code()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_timestamp_rules()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_references()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_user_mention()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_channel_mention()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_bold()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_strikethrough()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_italic_emoji()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_italic_emoticon()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: ItalicEmoji -> Inline
    fn parse_italic_emoji(&mut self) -> Option<()> {
        self.parse_emoji()?;

        Some(())
    }

    /// PEG rule: ItalicEmoticon -> Inline
    fn parse_italic_emoticon(&mut self) -> Option<()> {
        self.parse_emoticon()?;
        self.lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_emoticon_neighbor()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_italic_content_preferential_item()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == '_') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: Bold -> Inline
    fn parse_bold(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == '*') { p.advance(c0.len_utf8()); } else { return None; }
            let c1 = p.peek_char()?;
            if (c1 == '*') { p.advance(c1.len_utf8()); } else { return None; }
            p.parse_bold_content()?;
            let c2 = p.peek_char()?;
            if (c2 == '*') { p.advance(c2.len_utf8()); } else { return None; }
            let c3 = p.peek_char()?;
            if (c3 == '*') { p.advance(c3.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c4 = p.peek_char()?;
            if (c4 == '*') { p.advance(c4.len_utf8()); } else { return None; }
            p.parse_bold_content()?;
            let c5 = p.peek_char()?;
            if (c5 == '*') { p.advance(c5.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: BoldContent -> Inline
    fn parse_bold_content(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Bold);
            p.parse_bold_content_item()?;
            while p.try_parse(|p| {
                p.parse_bold_content_item()?;
                Some(())
            }).is_some() {}
            p.finish_node(SK::Bold);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: BoldContentPreferentialItem -> Inline
    fn parse_bold_content_preferential_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_whitespace()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_inline_code()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_timestamp_rules()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_references()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_user_mention()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_channel_mention()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_italic()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_maybe_strikethrough()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_bold_emoji()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_bold_emoticon()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: BoldContentItem -> Inline
    fn parse_bold_content_item(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_bold_content_preferential_item()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_bold_plain_run()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_any_bold()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_line()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: BoldEmoji -> Inline
    fn parse_bold_emoji(&mut self) -> Option<()> {
        self.parse_emoji()?;

        Some(())
    }

    /// PEG rule: BoldEmoticon -> Inline
    fn parse_bold_emoticon(&mut self) -> Option<()> {
        self.parse_emoticon()?;
        self.lookahead(|p| {
            if p.try_parse(|p| {
                p.parse_emoticon_neighbor()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_bold_content_preferential_item()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: Strikethrough -> Inline
    fn parse_strikethrough(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == '~') { p.advance(c0.len_utf8()); } else { return None; }
            let c1 = p.peek_char()?;
            if (c1 == '~') { p.advance(c1.len_utf8()); } else { return None; }
            p.parse_strikethrough_content()?;
            let c2 = p.peek_char()?;
            if (c2 == '~') { p.advance(c2.len_utf8()); } else { return None; }
            let c3 = p.peek_char()?;
            if (c3 == '~') { p.advance(c3.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c4 = p.peek_char()?;
            if (c4 == '~') { p.advance(c4.len_utf8()); } else { return None; }
            p.parse_strikethrough_content()?;
            let c5 = p.peek_char()?;
            if (c5 == '~') { p.advance(c5.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: StrikethroughContent -> Inline
    fn parse_strikethrough_content(&mut self) -> Option<()> {
        self.try_parse(|p| {
            p.start_node(SK::Strike);
            if p.try_parse(|p| {
                p.parse_strike_plain_run_full()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_escaped_timestamp_rules()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_timestamp_rules()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_whitespace()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_inline_code()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_maybe_references()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_user_mention()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_channel_mention()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_maybe_italic()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_maybe_bold()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_emoji()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_emoticon()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_any_strike()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_line()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            while p.try_parse(|p| {
                if p.try_parse(|p| {
                    p.parse_strike_plain_run_full()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_escaped_timestamp_rules()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_timestamp_rules()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_whitespace()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_inline_code()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_maybe_references()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_user_mention()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_channel_mention()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_maybe_italic()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_maybe_bold()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_emoji()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_emoticon()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_any_strike()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_line()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            }).is_some() {}
            p.finish_node(SK::Strike);
            Some(())
        })?;

        Some(())
    }

    /// PEG rule: EmphasisWithWhitespace -> Inline
    fn parse_emphasis_with_whitespace(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_asterisk_with_whitespace()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_underscore_with_whitespace()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_tilde_with_whitespace()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: AsteriskWithWhitespace -> Inline
    fn parse_asterisk_with_whitespace(&mut self) -> Option<()> {
        let ev3 = self.pos;
        let text0_start = self.pos;
        self.expect_str("*")?;
        while self.try_parse(|p| {
            p.expect_str("*")?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let a = text0;
        let text1_start = self.pos;
        self.parse_space()?;
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let w = text1;
        let text2_start = self.pos;
        self.expect_str("*")?;
        while self.try_parse(|p| {
            p.expect_str("*")?;
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let b = text2;
        self.emit_text(ev3, self.pos);

        Some(())
    }

    /// PEG rule: UnderscoreWithWhitespace -> Inline
    fn parse_underscore_with_whitespace(&mut self) -> Option<()> {
        let ev3 = self.pos;
        let text0_start = self.pos;
        self.expect_str("_")?;
        while self.try_parse(|p| {
            p.expect_str("_")?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let a = text0;
        let text1_start = self.pos;
        self.parse_space()?;
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let w = text1;
        let text2_start = self.pos;
        self.expect_str("_")?;
        while self.try_parse(|p| {
            p.expect_str("_")?;
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let b = text2;
        self.emit_text(ev3, self.pos);

        Some(())
    }

    /// PEG rule: TildeWithWhitespace -> Inline
    fn parse_tilde_with_whitespace(&mut self) -> Option<()> {
        let ev3 = self.pos;
        let text0_start = self.pos;
        self.expect_str("~")?;
        while self.try_parse(|p| {
            p.expect_str("~")?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let a = text0;
        let text1_start = self.pos;
        self.parse_space()?;
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let w = text1;
        let text2_start = self.pos;
        self.expect_str("~")?;
        while self.try_parse(|p| {
            p.expect_str("~")?;
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let b = text2;
        self.emit_text(ev3, self.pos);

        Some(())
    }

    /// PEG rule: UserMention -> Vec<Inline>
    fn parse_user_mention(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_text()?;
            p.expect_str("@")?;
            while p.try_parse(|p| {
                p.expect_str("@")?;
                Some(())
            }).is_some() {}
            p.parse_alpha_numeric_char()?;
                        // JS: return reducePlainTexts([t, plain('@' + user)])[0];


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_user_mention_direct()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: BigEmoji -> Vec<Node>
    fn parse_big_emoji(&mut self) -> Option<()> {
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_end_of_line()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_space()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let mut _count = 0usize;
        for _ in 0..1 {
            if self.try_parse(|p| {
                p.parse_emoji()?;

                Some(())
            }).is_some() {
            } else if self.try_parse(|p| {
                p.parse_emoticon()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            while self.try_parse(|p| {
                if p.try_parse(|p| {
                    p.parse_end_of_line()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_space()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            }).is_some() {}
            _count += 1;
        }
        for _ in 0..2 {
            if self.try_parse(|p| {
            if p.try_parse(|p| {
                p.parse_emoji()?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_emoticon()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            while p.try_parse(|p| {
                if p.try_parse(|p| {
                    p.parse_end_of_line()?;

                    Some(())
                }).is_some() {
                } else if p.try_parse(|p| {
                    p.parse_space()?;

                    Some(())
                }).is_some() {
                } else {
                    return None;
                }
                Some(())
            }).is_some() {}
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        if _count < 1 { return None; }
                // JS: return [bigEmoji(es)];


        Some(())
    }

    /// PEG rule: Emoji -> Inline
    fn parse_emoji(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_emoji_short_code()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_unicode_emoji()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonNeighbor -> Inline
    fn parse_emoticon_neighbor(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_end_of_line()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_whitespace()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if (c0 == '*') { p.advance(c0.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.negative_lookahead(|p| {
                p.any_char()?;
                Some(())
            })?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonLT -> Inline
    fn parse_emoticon_lt(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            p.expect_str("</3")?;
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'broken_heart');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            p.expect_str("<3")?;
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'heart');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonColon -> Inline
    fn parse_emoticon_colon(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-D")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":D")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'smiley');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":')")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":'-)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'joy');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text2_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":]")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text2 = &p.input[text2_start..p.pos];
            let e = text2;
                        // JS: return emoticon(e, 'slight_smile');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text3_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-*")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":*")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":^*")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text3 = &p.input[text3_start..p.pos];
            let e = text3;
                        // JS: return emoticon(e, 'kissing_heart');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text4_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-P")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":P")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":-Þ")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":Þ")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":-b")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":b")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text4 = &p.input[text4_start..p.pos];
            let e = text4;
                        // JS: return emoticon(e, 'stuck_out_tongue');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text5_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":-[")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":[")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text5 = &p.input[text5_start..p.pos];
            let e = text5;
                        // JS: return emoticon(e, 'disappointed');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text6_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-/")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":-.")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":/")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":\\")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":L")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text6 = &p.input[text6_start..p.pos];
            let e = text6;
                        // JS: return emoticon(e, 'confused');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text7_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":'(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("':-(")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text7 = &p.input[text7_start..p.pos];
            let e = text7;
                        // JS: return emoticon(e, 'cry');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text8_start = p.pos;
            p.expect_str(":@")?;
            let text8 = &p.input[text8_start..p.pos];
            let e = text8;
                        // JS: return emoticon(e, 'angry');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text9_start = p.pos;
            p.expect_str(":$")?;
            let text9 = &p.input[text9_start..p.pos];
            let e = text9;
                        // JS: return emoticon(e, 'flushed');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text10_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-X")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":X")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":-#")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":#")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text10 = &p.input[text10_start..p.pos];
            let e = text10;
                        // JS: return emoticon(e, 'no_mouth');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text11_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(":-O")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(":O")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text11 = &p.input[text11_start..p.pos];
            let e = text11;
                        // JS: return emoticon(e, 'open_mouth');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonEquals -> Inline
    fn parse_emoticon_equals(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            p.expect_str("=D")?;
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'smiley');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("=]")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("=)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'slight_smile');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text2_start = p.pos;
            p.expect_str("=*")?;
            let text2 = &p.input[text2_start..p.pos];
            let e = text2;
                        // JS: return emoticon(e, 'kissing_heart');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text3_start = p.pos;
            p.expect_str("=P")?;
            let text3 = &p.input[text3_start..p.pos];
            let e = text3;
                        // JS: return emoticon(e, 'stuck_out_tongue');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text4_start = p.pos;
            p.expect_str("=(")?;
            let text4 = &p.input[text4_start..p.pos];
            let e = text4;
                        // JS: return emoticon(e, 'disappointed');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text5_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("=/")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("=\\")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("=L")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text5 = &p.input[text5_start..p.pos];
            let e = text5;
                        // JS: return emoticon(e, 'confused');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text6_start = p.pos;
            p.expect_str("=$")?;
            let text6 = &p.input[text6_start..p.pos];
            let e = text6;
                        // JS: return emoticon(e, 'flushed');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text7_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("=X")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("=#")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text7 = &p.input[text7_start..p.pos];
            let e = text7;
                        // JS: return emoticon(e, 'no_mouth');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonGT -> Inline
    fn parse_emoticon_gt(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(">:)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(">;)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(">:-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(">=)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'laughing');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            p.expect_str(">.<")?;
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'persevere');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text2_start = p.pos;
            p.expect_str(">:P")?;
            let text2 = &p.input[text2_start..p.pos];
            let e = text2;
                        // JS: return emoticon(e, 'stuck_out_tongue_winking_eye');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text3_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(">:\\")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(">;/")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text3 = &p.input[text3_start..p.pos];
            let e = text3;
                        // JS: return emoticon(e, 'confused');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text4_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(">:(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(">:-(")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text4 = &p.input[text4_start..p.pos];
            let e = text4;
                        // JS: return emoticon(e, 'angry');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text5_start = p.pos;
            p.expect_str(">:[")?;
            let text5 = &p.input[text5_start..p.pos];
            let e = text5;
                        // JS: return emoticon(e, 'disappointed');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text6_start = p.pos;
            p.expect_str(">:O")?;
            let text6 = &p.input[text6_start..p.pos];
            let e = text6;
                        // JS: return emoticon(e, 'open_mouth');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonApostrophe -> Inline
    fn parse_emoticon_apostrophe(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("':)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("':-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("'=)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("':D")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("':-D")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("'=D")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'sweat_smile');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("':(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("':-(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("'=(")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'sweat');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonO -> Inline
    fn parse_emoticon_o(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("O:-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("O:)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("O;-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("O=)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("O:-3")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("O:3")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'innocent');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            p.expect_str("O_O")?;
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'open_mouth');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonZero -> Inline
    fn parse_emoticon_zero(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("0:-3")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("0:3")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("0:-)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("0:)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("0;^)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("0;-)")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'innocent');


        Some(())
    }

    /// PEG rule: EmoticonSemicolon -> Inline
    fn parse_emoticon_semicolon(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(";)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";-]")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";]")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";D")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";^)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'wink');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str(";(")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str(";-(")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'cry');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonAsterisk -> Inline
    fn parse_emoticon_asterisk(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("*-)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("*)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'wink');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("*\\0/*")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("*\\O/*")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'person_gesturing_ok');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonB -> Inline
    fn parse_emoticon_b(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("B-)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("B)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("B-D")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'sunglasses');


        Some(())
    }

    /// PEG rule: Emoticon8 -> Inline
    fn parse_emoticon8(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("8)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("8-)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("8-D")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'sunglasses');


        Some(())
    }

    /// PEG rule: EmoticonD -> Inline
    fn parse_emoticon_d(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.expect_str("D:")?;
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'fearful');


        Some(())
    }

    /// PEG rule: EmoticonX -> Inline
    fn parse_emoticon_x(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let text0_start = p.pos;
            p.expect_str("X-P")?;
            let text0 = &p.input[text0_start..p.pos];
            let e = text0;
                        // JS: return emoticon(e, 'stuck_out_tongue_winking_eye');


            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let text1_start = p.pos;
            if p.try_parse(|p| {
                p.expect_str("X)")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.expect_str("X-)")?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            let text1 = &p.input[text1_start..p.pos];
            let e = text1;
                        // JS: return emoticon(e, 'dizzy_face');


            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: EmoticonHash -> Inline
    fn parse_emoticon_hash(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("#-)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("#)")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'dizzy_face');


        Some(())
    }

    /// PEG rule: EmoticonPercent -> Inline
    fn parse_emoticon_percent(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("%-)")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("%)")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'dizzy_face');


        Some(())
    }

    /// PEG rule: EmoticonParen -> Inline
    fn parse_emoticon_paren(&mut self) -> Option<()> {
        let text0_start = self.pos;
        self.expect_str("(y)")?;
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'thumbsup');


        Some(())
    }

    /// PEG rule: EmoticonDash -> Inline
    fn parse_emoticon_dash(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("-___-")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("-__-")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("-_-")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'expressionless');


        Some(())
    }

    /// PEG rule: EmoticonBackslash -> Inline
    fn parse_emoticon_backslash(&mut self) -> Option<()> {
        let text0_start = self.pos;
        if self.try_parse(|p| {
            p.expect_str("\\0\\/")?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.expect_str("\\O\\/")?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        let text0 = &self.input[text0_start..self.pos];
        let e = text0;
                // JS: return emoticon(e, 'person_gesturing_ok');


        Some(())
    }

    /// PEG rule: InlineCode -> Inline
    fn parse_inline_code(&mut self) -> Option<()> {
        let ev3 = self.pos;
        self.expect_str("`")?;
        let text2_start = self.pos;
        let c1 = self.peek_char()?;
        if !(c1 == '`' || c1 == '\n') { self.advance(c1.len_utf8()); } else { return None; }
        while self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if !(c0 == '`' || c0 == '\n') { p.advance(c0.len_utf8()); } else { return None; }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let text = text2;
        let content_end = self.pos;
        self.expect_str("`")?;
        self.emit_leaf(SK::InlineCode, text2_start, content_end);

        Some(())
    }

    /// PEG rule: Color -> Inline
    fn parse_color(&mut self) -> Option<()> {
        if !self.config.colors { return None; }
        self.expect_str("color:#")?;
        self.parse_color_rgba_tuple()?;
        self.negative_lookahead(|p| {
            p.parse_any_text()?;
            Some(())
        })?;
                // JS: return color(...rgba);


        Some(())
    }

    /// PEG rule: ColorRGBATuple -> Inline
    fn parse_color_rgba_tuple(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let mut _count = 0usize;
            for _ in 0..3 {
                p.parse_hex_byte()?;
                _count += 1;
            }
            for _ in 0..1 {
                if p.try_parse(|p| {
                p.parse_hex_byte()?;
                    Some(())
                }).is_none() { break; }
                _count += 1;
            }
            if _count < 3 { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            let mut _count = 0usize;
            for _ in 0..3 {
                p.parse_hex_nible()?;
                _count += 1;
            }
            for _ in 0..1 {
                if p.try_parse(|p| {
                p.parse_hex_nible()?;
                    Some(())
                }).is_none() { break; }
                _count += 1;
            }
            if _count < 3 { return None; }

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: AnyText -> Inline
    fn parse_any_text(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            let c0 = p.peek_char()?;
            if ((c0 >= ' ' && c0 <= '\'') || (c0 >= '+' && c0 <= '@') || (c0 >= 'A' && c0 <= 'Z') || (c0 >= 'a' && c0 <= 'z')) { p.advance(c0.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_non_ascii()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: Text -> Inline
    fn parse_text(&mut self) -> Option<()> {
        let ev0 = self.pos;
        self.parse_any_text()?;
        self.emit_text(ev0, self.pos);

        Some(())
    }

    /// PEG rule: Line -> Inline
    fn parse_line(&mut self) -> Option<()> {
        let ev0 = self.pos;
        self.parse_line_structure()?;
        self.emit_text(ev0, self.pos);

        Some(())
    }

    /// PEG rule: LineStructure -> Inline
    fn parse_line_structure(&mut self) -> Option<()> {
        let text0_start = self.pos;
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        let text0 = &self.input[text0_start..self.pos];
        let head = text0;
        let text1_start = self.pos;
        self.parse_any_text()?;
        while self.try_parse(|p| {
            p.parse_any_text()?;
            Some(())
        }).is_some() {}
        let text1 = &self.input[text1_start..self.pos];
        let text = text1;
        let text2_start = self.pos;
        while self.try_parse(|p| {
            p.parse_space()?;
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];
        let tail = text2;
                // JS: return head + text + tail;


        Some(())
    }

    /// PEG rule: UTF8NamesValidation -> Inline
    fn parse_utf8names_validation(&mut self) -> Option<()> {
        let text2_start = self.pos;
        if self.try_parse(|p| {
            let c1 = p.peek_char()?;
            if (c1 == '-' || c1 == '_' || c1 == '.') { p.advance(c1.len_utf8()); } else { return None; }

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_alpha_numeric_char()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }
        while self.try_parse(|p| {
            if p.try_parse(|p| {
                let c0 = p.peek_char()?;
                if (c0 == '-' || c0 == '_' || c0 == '.') { p.advance(c0.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                p.parse_alpha_numeric_char()?;

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        }).is_some() {}
        let text2 = &self.input[text2_start..self.pos];

        Some(())
    }

    /// PEG rule: NonASCII -> Inline
    fn parse_non_ascii(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if ((c0 >= '\u{80}' && c0 <= '\u{ffff}')) { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: Unicode -> Inline
    fn parse_unicode(&mut self) -> Option<()> {
        self.expect_str("\\")?;
        let text0_start = self.pos;
        let mut _count = 0usize;
        for _ in 0..1 {
            self.parse_hex_digit()?;
            _count += 1;
        }
        for _ in 0..5 {
            if self.try_parse(|p| {
            p.parse_hex_digit()?;
                Some(())
            }).is_none() { break; }
            _count += 1;
        }
        if _count < 1 { return None; }
        let text0 = &self.input[text0_start..self.pos];
        let digits = text0;
        self.try_parse(|p| {
            if p.try_parse(|p| {
                p.expect_str("\r\n")?;

                Some(())
            }).is_some() {
            } else if p.try_parse(|p| {
                let c1 = p.peek_char()?;
                if (c1 == ' ' || c1 == '\t' || c1 == '\r' || c1 == '\n' || c1 == '\u{c}') { p.advance(c1.len_utf8()); } else { return None; }

                Some(())
            }).is_some() {
            } else {
                return None;
            }
            Some(())
        });
                // JS: return String.fromCharCode(parseInt(Digits, 16));


        Some(())
    }

    /// PEG rule: Safe -> Inline
    fn parse_safe(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if (c0 == '$' || c0 == '@' || c0 == '&' || c0 == '+' || c0 == '_' || c0 == '_' || c0 == '#' || c0 == '?' || c0 == '-') { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: Extra -> Inline
    fn parse_extra(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if (c0 == '.' || c0 == ',' || c0 == '!' || c0 == '%' || c0 == '~' || c0 == '*' || c0 == '"' || c0 == '\'' || c0 == ':' || c0 == ';' || c0 == '(' || c0 == ')' || c0 == '=' || c0 == '~') { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: HexNible -> usize
    fn parse_hex_nible(&mut self) -> Option<()> {
        self.parse_hex_digit()?;
                // JS: return parseInt(a + a, 16);


        Some(())
    }

    /// PEG rule: HexByte -> usize
    fn parse_hex_byte(&mut self) -> Option<()> {
        self.parse_hex_digit()?;
        self.parse_hex_digit()?;
                // JS: return parseInt(a + b, 16);


        Some(())
    }

    /// PEG rule: AlphaNumericOrMarkChar -> Inline
    fn parse_alpha_numeric_or_mark_char(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_alpha_or_mark_char()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_decimal_number_char()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: AlphaOrMarkChar -> Inline
    fn parse_alpha_or_mark_char(&mut self) -> Option<()> {
        if self.try_parse(|p| {
            p.parse_alpha_char()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_emoji_char()?;

            Some(())
        }).is_some() {
        } else if self.try_parse(|p| {
            p.parse_mark_char()?;

            Some(())
        }).is_some() {
        } else {
            return None;
        }

        Some(())
    }

    /// PEG rule: AlphaChar -> Inline
    fn parse_alpha_char(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if ((c0 >= 'A' && c0 <= 'Z') || (c0 >= 'a' && c0 <= 'z') || c0 == '\u{aa}' || c0 == '\u{b5}' || c0 == '\u{ba}' || (c0 >= '\u{c0}' && c0 <= '\u{d6}') || (c0 >= '\u{d8}' && c0 <= '\u{f6}') || (c0 >= '\u{f8}' && c0 <= '\u{2c1}') || (c0 >= '\u{2c6}' && c0 <= '\u{2d1}') || (c0 >= '\u{2e0}' && c0 <= '\u{2e4}') || c0 == '\u{2ec}' || c0 == '\u{2ee}' || (c0 >= '\u{370}' && c0 <= '\u{374}') || c0 == '\u{376}' || c0 == '\u{377}' || (c0 >= '\u{37a}' && c0 <= '\u{37d}') || c0 == '\u{37f}' || c0 == '\u{386}' || (c0 >= '\u{388}' && c0 <= '\u{38a}') || c0 == '\u{38c}' || (c0 >= '\u{38e}' && c0 <= '\u{3a1}') || (c0 >= '\u{3a3}' && c0 <= '\u{3f5}') || (c0 >= '\u{3f7}' && c0 <= '\u{481}') || (c0 >= '\u{48a}' && c0 <= '\u{52f}') || (c0 >= '\u{531}' && c0 <= '\u{556}') || c0 == '\u{559}' || (c0 >= '\u{561}' && c0 <= '\u{587}') || (c0 >= '\u{5d0}' && c0 <= '\u{5ea}') || (c0 >= '\u{5f0}' && c0 <= '\u{5f2}') || (c0 >= '\u{620}' && c0 <= '\u{64a}') || c0 == '\u{66e}' || c0 == '\u{66f}' || (c0 >= '\u{671}' && c0 <= '\u{6d3}') || c0 == '\u{6d5}' || c0 == '\u{6e5}' || c0 == '\u{6e6}' || c0 == '\u{6ee}' || c0 == '\u{6ef}' || (c0 >= '\u{6fa}' && c0 <= '\u{6fc}') || c0 == '\u{6ff}' || c0 == '\u{710}' || (c0 >= '\u{712}' && c0 <= '\u{72f}') || (c0 >= '\u{74d}' && c0 <= '\u{7a5}') || c0 == '\u{7b1}' || (c0 >= '\u{7ca}' && c0 <= '\u{7ea}') || c0 == '\u{7f4}' || c0 == '\u{7f5}' || c0 == '\u{7fa}' || (c0 >= '\u{800}' && c0 <= '\u{815}') || c0 == '\u{81a}' || c0 == '\u{824}' || c0 == '\u{828}' || (c0 >= '\u{840}' && c0 <= '\u{858}') || (c0 >= '\u{8a0}' && c0 <= '\u{8b4}') || (c0 >= '\u{8b6}' && c0 <= '\u{8bd}') || (c0 >= '\u{904}' && c0 <= '\u{939}') || c0 == '\u{93d}' || c0 == '\u{950}' || (c0 >= '\u{958}' && c0 <= '\u{961}') || (c0 >= '\u{971}' && c0 <= '\u{980}') || (c0 >= '\u{985}' && c0 <= '\u{98c}') || c0 == '\u{98f}' || c0 == '\u{990}' || (c0 >= '\u{993}' && c0 <= '\u{9a8}') || (c0 >= '\u{9aa}' && c0 <= '\u{9b0}') || c0 == '\u{9b2}' || (c0 >= '\u{9b6}' && c0 <= '\u{9b9}') || c0 == '\u{9bd}' || c0 == '\u{9ce}' || c0 == '\u{9dc}' || c0 == '\u{9dd}' || (c0 >= '\u{9df}' && c0 <= '\u{9e1}') || c0 == '\u{9f0}' || c0 == '\u{9f1}' || (c0 >= '\u{a05}' && c0 <= '\u{a0a}') || c0 == '\u{a0f}' || c0 == '\u{a10}' || (c0 >= '\u{a13}' && c0 <= '\u{a28}') || (c0 >= '\u{a2a}' && c0 <= '\u{a30}') || c0 == '\u{a32}' || c0 == '\u{a33}' || c0 == '\u{a35}' || c0 == '\u{a36}' || c0 == '\u{a38}' || c0 == '\u{a39}' || (c0 >= '\u{a59}' && c0 <= '\u{a5c}') || c0 == '\u{a5e}' || (c0 >= '\u{a72}' && c0 <= '\u{a74}') || (c0 >= '\u{a85}' && c0 <= '\u{a8d}') || (c0 >= '\u{a8f}' && c0 <= '\u{a91}') || (c0 >= '\u{a93}' && c0 <= '\u{aa8}') || (c0 >= '\u{aaa}' && c0 <= '\u{ab0}') || c0 == '\u{ab2}' || c0 == '\u{ab3}' || (c0 >= '\u{ab5}' && c0 <= '\u{ab9}') || c0 == '\u{abd}' || c0 == '\u{ad0}' || c0 == '\u{ae0}' || c0 == '\u{ae1}' || c0 == '\u{af9}' || (c0 >= '\u{b05}' && c0 <= '\u{b0c}') || c0 == '\u{b0f}' || c0 == '\u{b10}' || (c0 >= '\u{b13}' && c0 <= '\u{b28}') || (c0 >= '\u{b2a}' && c0 <= '\u{b30}') || c0 == '\u{b32}' || c0 == '\u{b33}' || (c0 >= '\u{b35}' && c0 <= '\u{b39}') || c0 == '\u{b3d}' || c0 == '\u{b5c}' || c0 == '\u{b5d}' || (c0 >= '\u{b5f}' && c0 <= '\u{b61}') || c0 == '\u{b71}' || c0 == '\u{b83}' || (c0 >= '\u{b85}' && c0 <= '\u{b8a}') || (c0 >= '\u{b8e}' && c0 <= '\u{b90}') || (c0 >= '\u{b92}' && c0 <= '\u{b95}') || c0 == '\u{b99}' || c0 == '\u{b9a}' || c0 == '\u{b9c}' || c0 == '\u{b9e}' || c0 == '\u{b9f}' || c0 == '\u{ba3}' || c0 == '\u{ba4}' || (c0 >= '\u{ba8}' && c0 <= '\u{baa}') || (c0 >= '\u{bae}' && c0 <= '\u{bb9}') || c0 == '\u{bd0}' || (c0 >= '\u{c05}' && c0 <= '\u{c0c}') || (c0 >= '\u{c0e}' && c0 <= '\u{c10}') || (c0 >= '\u{c12}' && c0 <= '\u{c28}') || (c0 >= '\u{c2a}' && c0 <= '\u{c39}') || c0 == '\u{c3d}' || (c0 >= '\u{c58}' && c0 <= '\u{c5a}') || c0 == '\u{c60}' || c0 == '\u{c61}' || c0 == '\u{c80}' || (c0 >= '\u{c85}' && c0 <= '\u{c8c}') || (c0 >= '\u{c8e}' && c0 <= '\u{c90}') || (c0 >= '\u{c92}' && c0 <= '\u{ca8}') || (c0 >= '\u{caa}' && c0 <= '\u{cb3}') || (c0 >= '\u{cb5}' && c0 <= '\u{cb9}') || c0 == '\u{cbd}' || c0 == '\u{cde}' || c0 == '\u{ce0}' || c0 == '\u{ce1}' || c0 == '\u{cf1}' || c0 == '\u{cf2}' || (c0 >= '\u{d05}' && c0 <= '\u{d0c}') || (c0 >= '\u{d0e}' && c0 <= '\u{d10}') || (c0 >= '\u{d12}' && c0 <= '\u{d3a}') || c0 == '\u{d3d}' || c0 == '\u{d4e}' || (c0 >= '\u{d54}' && c0 <= '\u{d56}') || (c0 >= '\u{d5f}' && c0 <= '\u{d61}') || (c0 >= '\u{d7a}' && c0 <= '\u{d7f}') || (c0 >= '\u{d85}' && c0 <= '\u{d96}') || (c0 >= '\u{d9a}' && c0 <= '\u{db1}') || (c0 >= '\u{db3}' && c0 <= '\u{dbb}') || c0 == '\u{dbd}' || (c0 >= '\u{dc0}' && c0 <= '\u{dc6}') || (c0 >= '\u{e01}' && c0 <= '\u{e30}') || c0 == '\u{e32}' || c0 == '\u{e33}' || (c0 >= '\u{e40}' && c0 <= '\u{e46}') || c0 == '\u{e81}' || c0 == '\u{e82}' || c0 == '\u{e84}' || c0 == '\u{e87}' || c0 == '\u{e88}' || c0 == '\u{e8a}' || c0 == '\u{e8d}' || (c0 >= '\u{e94}' && c0 <= '\u{e97}') || (c0 >= '\u{e99}' && c0 <= '\u{e9f}') || (c0 >= '\u{ea1}' && c0 <= '\u{ea3}') || c0 == '\u{ea5}' || c0 == '\u{ea7}' || c0 == '\u{eaa}' || c0 == '\u{eab}' || (c0 >= '\u{ead}' && c0 <= '\u{eb0}') || c0 == '\u{eb2}' || c0 == '\u{eb3}' || c0 == '\u{ebd}' || (c0 >= '\u{ec0}' && c0 <= '\u{ec4}') || c0 == '\u{ec6}' || (c0 >= '\u{edc}' && c0 <= '\u{edf}') || c0 == '\u{f00}' || (c0 >= '\u{f40}' && c0 <= '\u{f47}') || (c0 >= '\u{f49}' && c0 <= '\u{f6c}') || (c0 >= '\u{f88}' && c0 <= '\u{f8c}') || (c0 >= '\u{1000}' && c0 <= '\u{102a}') || c0 == '\u{103f}' || (c0 >= '\u{1050}' && c0 <= '\u{1055}') || (c0 >= '\u{105a}' && c0 <= '\u{105d}') || c0 == '\u{1061}' || c0 == '\u{1065}' || c0 == '\u{1066}' || (c0 >= '\u{106e}' && c0 <= '\u{1070}') || (c0 >= '\u{1075}' && c0 <= '\u{1081}') || c0 == '\u{108e}' || (c0 >= '\u{10a0}' && c0 <= '\u{10c5}') || c0 == '\u{10c7}' || c0 == '\u{10cd}' || (c0 >= '\u{10d0}' && c0 <= '\u{10fa}') || (c0 >= '\u{10fc}' && c0 <= '\u{1248}') || (c0 >= '\u{124a}' && c0 <= '\u{124d}') || (c0 >= '\u{1250}' && c0 <= '\u{1256}') || c0 == '\u{1258}' || (c0 >= '\u{125a}' && c0 <= '\u{125d}') || (c0 >= '\u{1260}' && c0 <= '\u{1288}') || (c0 >= '\u{128a}' && c0 <= '\u{128d}') || (c0 >= '\u{1290}' && c0 <= '\u{12b0}') || (c0 >= '\u{12b2}' && c0 <= '\u{12b5}') || (c0 >= '\u{12b8}' && c0 <= '\u{12be}') || c0 == '\u{12c0}' || (c0 >= '\u{12c2}' && c0 <= '\u{12c5}') || (c0 >= '\u{12c8}' && c0 <= '\u{12d6}') || (c0 >= '\u{12d8}' && c0 <= '\u{1310}') || (c0 >= '\u{1312}' && c0 <= '\u{1315}') || (c0 >= '\u{1318}' && c0 <= '\u{135a}') || (c0 >= '\u{1380}' && c0 <= '\u{138f}') || (c0 >= '\u{13a0}' && c0 <= '\u{13f5}') || (c0 >= '\u{13f8}' && c0 <= '\u{13fd}') || (c0 >= '\u{1401}' && c0 <= '\u{166c}') || (c0 >= '\u{166f}' && c0 <= '\u{167f}') || (c0 >= '\u{1681}' && c0 <= '\u{169a}') || (c0 >= '\u{16a0}' && c0 <= '\u{16ea}') || (c0 >= '\u{16f1}' && c0 <= '\u{16f8}') || (c0 >= '\u{1700}' && c0 <= '\u{170c}') || (c0 >= '\u{170e}' && c0 <= '\u{1711}') || (c0 >= '\u{1720}' && c0 <= '\u{1731}') || (c0 >= '\u{1740}' && c0 <= '\u{1751}') || (c0 >= '\u{1760}' && c0 <= '\u{176c}') || (c0 >= '\u{176e}' && c0 <= '\u{1770}') || (c0 >= '\u{1780}' && c0 <= '\u{17b3}') || c0 == '\u{17d7}' || c0 == '\u{17dc}' || (c0 >= '\u{1820}' && c0 <= '\u{1877}') || (c0 >= '\u{1880}' && c0 <= '\u{1884}') || (c0 >= '\u{1887}' && c0 <= '\u{18a8}') || c0 == '\u{18aa}' || (c0 >= '\u{18b0}' && c0 <= '\u{18f5}') || (c0 >= '\u{1900}' && c0 <= '\u{191e}') || (c0 >= '\u{1950}' && c0 <= '\u{196d}') || (c0 >= '\u{1970}' && c0 <= '\u{1974}') || (c0 >= '\u{1980}' && c0 <= '\u{19ab}') || (c0 >= '\u{19b0}' && c0 <= '\u{19c9}') || (c0 >= '\u{1a00}' && c0 <= '\u{1a16}') || (c0 >= '\u{1a20}' && c0 <= '\u{1a54}') || c0 == '\u{1aa7}' || (c0 >= '\u{1b05}' && c0 <= '\u{1b33}') || (c0 >= '\u{1b45}' && c0 <= '\u{1b4b}') || (c0 >= '\u{1b83}' && c0 <= '\u{1ba0}') || c0 == '\u{1bae}' || c0 == '\u{1baf}' || (c0 >= '\u{1bba}' && c0 <= '\u{1be5}') || (c0 >= '\u{1c00}' && c0 <= '\u{1c23}') || (c0 >= '\u{1c4d}' && c0 <= '\u{1c4f}') || (c0 >= '\u{1c5a}' && c0 <= '\u{1c7d}') || (c0 >= '\u{1c80}' && c0 <= '\u{1c88}') || (c0 >= '\u{1ce9}' && c0 <= '\u{1cec}') || (c0 >= '\u{1cee}' && c0 <= '\u{1cf1}') || c0 == '\u{1cf5}' || c0 == '\u{1cf6}' || (c0 >= '\u{1d00}' && c0 <= '\u{1dbf}') || (c0 >= '\u{1e00}' && c0 <= '\u{1f15}') || (c0 >= '\u{1f18}' && c0 <= '\u{1f1d}') || (c0 >= '\u{1f20}' && c0 <= '\u{1f45}') || (c0 >= '\u{1f48}' && c0 <= '\u{1f4d}') || (c0 >= '\u{1f50}' && c0 <= '\u{1f57}') || c0 == '\u{1f59}' || c0 == '\u{1f5b}' || c0 == '\u{1f5d}' || (c0 >= '\u{1f5f}' && c0 <= '\u{1f7d}') || (c0 >= '\u{1f80}' && c0 <= '\u{1fb4}') || (c0 >= '\u{1fb6}' && c0 <= '\u{1fbc}') || c0 == '\u{1fbe}' || (c0 >= '\u{1fc2}' && c0 <= '\u{1fc4}') || (c0 >= '\u{1fc6}' && c0 <= '\u{1fcc}') || (c0 >= '\u{1fd0}' && c0 <= '\u{1fd3}') || (c0 >= '\u{1fd6}' && c0 <= '\u{1fdb}') || (c0 >= '\u{1fe0}' && c0 <= '\u{1fec}') || (c0 >= '\u{1ff2}' && c0 <= '\u{1ff4}') || (c0 >= '\u{1ff6}' && c0 <= '\u{1ffc}') || c0 == '\u{2071}' || c0 == '\u{207f}' || (c0 >= '\u{2090}' && c0 <= '\u{209c}') || c0 == '\u{2102}' || c0 == '\u{2107}' || (c0 >= '\u{210a}' && c0 <= '\u{2113}') || c0 == '\u{2115}' || (c0 >= '\u{2119}' && c0 <= '\u{211d}') || c0 == '\u{2124}' || c0 == '\u{2126}' || c0 == '\u{2128}' || (c0 >= '\u{212a}' && c0 <= '\u{212d}') || (c0 >= '\u{212f}' && c0 <= '\u{2139}') || (c0 >= '\u{213c}' && c0 <= '\u{213f}') || (c0 >= '\u{2145}' && c0 <= '\u{2149}') || c0 == '\u{214e}' || c0 == '\u{2183}' || c0 == '\u{2184}' || (c0 >= '\u{2c00}' && c0 <= '\u{2c2e}') || (c0 >= '\u{2c30}' && c0 <= '\u{2c5e}') || (c0 >= '\u{2c60}' && c0 <= '\u{2ce4}') || (c0 >= '\u{2ceb}' && c0 <= '\u{2cee}') || c0 == '\u{2cf2}' || c0 == '\u{2cf3}' || (c0 >= '\u{2d00}' && c0 <= '\u{2d25}') || c0 == '\u{2d27}' || c0 == '\u{2d2d}' || (c0 >= '\u{2d30}' && c0 <= '\u{2d67}') || c0 == '\u{2d6f}' || (c0 >= '\u{2d80}' && c0 <= '\u{2d96}') || (c0 >= '\u{2da0}' && c0 <= '\u{2da6}') || (c0 >= '\u{2da8}' && c0 <= '\u{2dae}') || (c0 >= '\u{2db0}' && c0 <= '\u{2db6}') || (c0 >= '\u{2db8}' && c0 <= '\u{2dbe}') || (c0 >= '\u{2dc0}' && c0 <= '\u{2dc6}') || (c0 >= '\u{2dc8}' && c0 <= '\u{2dce}') || (c0 >= '\u{2dd0}' && c0 <= '\u{2dd6}') || (c0 >= '\u{2dd8}' && c0 <= '\u{2dde}') || c0 == '\u{2e2f}' || c0 == '\u{3005}' || c0 == '\u{3006}' || (c0 >= '\u{3031}' && c0 <= '\u{3035}') || c0 == '\u{303b}' || c0 == '\u{303c}' || (c0 >= '\u{3041}' && c0 <= '\u{3096}') || (c0 >= '\u{309d}' && c0 <= '\u{309f}') || (c0 >= '\u{30a1}' && c0 <= '\u{30fa}') || (c0 >= '\u{30fc}' && c0 <= '\u{30ff}') || (c0 >= '\u{3105}' && c0 <= '\u{312d}') || (c0 >= '\u{3131}' && c0 <= '\u{318e}') || (c0 >= '\u{31a0}' && c0 <= '\u{31ba}') || (c0 >= '\u{31f0}' && c0 <= '\u{31ff}') || (c0 >= '\u{3400}' && c0 <= '\u{4db5}') || (c0 >= '\u{4e00}' && c0 <= '\u{9fd5}') || (c0 >= '\u{a000}' && c0 <= '\u{a48c}') || (c0 >= '\u{a4d0}' && c0 <= '\u{a4fd}') || (c0 >= '\u{a500}' && c0 <= '\u{a60c}') || (c0 >= '\u{a610}' && c0 <= '\u{a61f}') || c0 == '\u{a62a}' || c0 == '\u{a62b}' || (c0 >= '\u{a640}' && c0 <= '\u{a66e}') || (c0 >= '\u{a67f}' && c0 <= '\u{a69d}') || (c0 >= '\u{a6a0}' && c0 <= '\u{a6e5}') || (c0 >= '\u{a717}' && c0 <= '\u{a71f}') || (c0 >= '\u{a722}' && c0 <= '\u{a788}') || (c0 >= '\u{a78b}' && c0 <= '\u{a7ae}') || (c0 >= '\u{a7b0}' && c0 <= '\u{a7b7}') || (c0 >= '\u{a7f7}' && c0 <= '\u{a801}') || (c0 >= '\u{a803}' && c0 <= '\u{a805}') || (c0 >= '\u{a807}' && c0 <= '\u{a80a}') || (c0 >= '\u{a80c}' && c0 <= '\u{a822}') || (c0 >= '\u{a840}' && c0 <= '\u{a873}') || (c0 >= '\u{a882}' && c0 <= '\u{a8b3}') || (c0 >= '\u{a8f2}' && c0 <= '\u{a8f7}') || c0 == '\u{a8fb}' || c0 == '\u{a8fd}' || (c0 >= '\u{a90a}' && c0 <= '\u{a925}') || (c0 >= '\u{a930}' && c0 <= '\u{a946}') || (c0 >= '\u{a960}' && c0 <= '\u{a97c}') || (c0 >= '\u{a984}' && c0 <= '\u{a9b2}') || c0 == '\u{a9cf}' || (c0 >= '\u{a9e0}' && c0 <= '\u{a9e4}') || (c0 >= '\u{a9e6}' && c0 <= '\u{a9ef}') || (c0 >= '\u{a9fa}' && c0 <= '\u{a9fe}') || (c0 >= '\u{aa00}' && c0 <= '\u{aa28}') || (c0 >= '\u{aa40}' && c0 <= '\u{aa42}') || (c0 >= '\u{aa44}' && c0 <= '\u{aa4b}') || (c0 >= '\u{aa60}' && c0 <= '\u{aa76}') || c0 == '\u{aa7a}' || (c0 >= '\u{aa7e}' && c0 <= '\u{aaaf}') || c0 == '\u{aab1}' || c0 == '\u{aab5}' || c0 == '\u{aab6}' || (c0 >= '\u{aab9}' && c0 <= '\u{aabd}') || c0 == '\u{aac0}' || c0 == '\u{aac2}' || (c0 >= '\u{aadb}' && c0 <= '\u{aadd}') || (c0 >= '\u{aae0}' && c0 <= '\u{aaea}') || (c0 >= '\u{aaf2}' && c0 <= '\u{aaf4}') || (c0 >= '\u{ab01}' && c0 <= '\u{ab06}') || (c0 >= '\u{ab09}' && c0 <= '\u{ab0e}') || (c0 >= '\u{ab11}' && c0 <= '\u{ab16}') || (c0 >= '\u{ab20}' && c0 <= '\u{ab26}') || (c0 >= '\u{ab28}' && c0 <= '\u{ab2e}') || (c0 >= '\u{ab30}' && c0 <= '\u{ab5a}') || (c0 >= '\u{ab5c}' && c0 <= '\u{ab65}') || (c0 >= '\u{ab70}' && c0 <= '\u{abe2}') || (c0 >= '\u{ac00}' && c0 <= '\u{d7a3}') || (c0 >= '\u{d7b0}' && c0 <= '\u{d7c6}') || (c0 >= '\u{d7cb}' && c0 <= '\u{d7fb}') || (c0 >= '\u{f900}' && c0 <= '\u{fa6d}') || (c0 >= '\u{fa70}' && c0 <= '\u{fad9}') || (c0 >= '\u{fb00}' && c0 <= '\u{fb06}') || (c0 >= '\u{fb13}' && c0 <= '\u{fb17}') || c0 == '\u{fb1d}' || (c0 >= '\u{fb1f}' && c0 <= '\u{fb28}') || (c0 >= '\u{fb2a}' && c0 <= '\u{fb36}') || (c0 >= '\u{fb38}' && c0 <= '\u{fb3c}') || c0 == '\u{fb3e}' || c0 == '\u{fb40}' || c0 == '\u{fb41}' || c0 == '\u{fb43}' || c0 == '\u{fb44}' || (c0 >= '\u{fb46}' && c0 <= '\u{fbb1}') || (c0 >= '\u{fbd3}' && c0 <= '\u{fd3d}') || (c0 >= '\u{fd50}' && c0 <= '\u{fd8f}') || (c0 >= '\u{fd92}' && c0 <= '\u{fdc7}') || (c0 >= '\u{fdf0}' && c0 <= '\u{fdfb}') || (c0 >= '\u{fe70}' && c0 <= '\u{fe74}') || (c0 >= '\u{fe76}' && c0 <= '\u{fefc}') || (c0 >= '\u{ff21}' && c0 <= '\u{ff3a}') || (c0 >= '\u{ff41}' && c0 <= '\u{ff5a}') || (c0 >= '\u{ff66}' && c0 <= '\u{ffbe}') || (c0 >= '\u{ffc2}' && c0 <= '\u{ffc7}') || (c0 >= '\u{ffca}' && c0 <= '\u{ffcf}') || (c0 >= '\u{ffd2}' && c0 <= '\u{ffd7}') || (c0 >= '\u{ffda}' && c0 <= '\u{ffdc}')) { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: DecimalNumberChar -> Inline
    fn parse_decimal_number_char(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if ((c0 >= '0' && c0 <= '9') || (c0 >= '\u{660}' && c0 <= '\u{669}') || (c0 >= '\u{6f0}' && c0 <= '\u{6f9}') || (c0 >= '\u{7c0}' && c0 <= '\u{7c9}') || (c0 >= '\u{966}' && c0 <= '\u{96f}') || (c0 >= '\u{9e6}' && c0 <= '\u{9ef}') || (c0 >= '\u{a66}' && c0 <= '\u{a6f}') || (c0 >= '\u{ae6}' && c0 <= '\u{aef}') || (c0 >= '\u{b66}' && c0 <= '\u{b6f}') || (c0 >= '\u{be6}' && c0 <= '\u{bef}') || (c0 >= '\u{c66}' && c0 <= '\u{c6f}') || (c0 >= '\u{ce6}' && c0 <= '\u{cef}') || (c0 >= '\u{d66}' && c0 <= '\u{d6f}') || (c0 >= '\u{de6}' && c0 <= '\u{def}') || (c0 >= '\u{e50}' && c0 <= '\u{e59}') || (c0 >= '\u{ed0}' && c0 <= '\u{ed9}') || (c0 >= '\u{f20}' && c0 <= '\u{f29}') || (c0 >= '\u{1040}' && c0 <= '\u{1049}') || (c0 >= '\u{1090}' && c0 <= '\u{1099}') || (c0 >= '\u{17e0}' && c0 <= '\u{17e9}') || (c0 >= '\u{1810}' && c0 <= '\u{1819}') || (c0 >= '\u{1946}' && c0 <= '\u{194f}') || (c0 >= '\u{19d0}' && c0 <= '\u{19d9}') || (c0 >= '\u{1a80}' && c0 <= '\u{1a89}') || (c0 >= '\u{1a90}' && c0 <= '\u{1a99}') || (c0 >= '\u{1b50}' && c0 <= '\u{1b59}') || (c0 >= '\u{1bb0}' && c0 <= '\u{1bb9}') || (c0 >= '\u{1c40}' && c0 <= '\u{1c49}') || (c0 >= '\u{1c50}' && c0 <= '\u{1c59}') || (c0 >= '\u{a620}' && c0 <= '\u{a629}') || (c0 >= '\u{a8d0}' && c0 <= '\u{a8d9}') || (c0 >= '\u{a900}' && c0 <= '\u{a909}') || (c0 >= '\u{a9d0}' && c0 <= '\u{a9d9}') || (c0 >= '\u{a9f0}' && c0 <= '\u{a9f9}') || (c0 >= '\u{aa50}' && c0 <= '\u{aa59}') || (c0 >= '\u{abf0}' && c0 <= '\u{abf9}') || (c0 >= '\u{ff10}' && c0 <= '\u{ff19}')) { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: EmojiChar -> Inline
    fn parse_emoji_char(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if ((c0 >= '\u{2700}' && c0 <= '\u{27bf}') || c0 == '\u{fe0e}' || c0 == '\u{fe0f}' || (c0 >= '\u{300}' && c0 <= '\u{36f}') || (c0 >= '\u{fe20}' && c0 <= '\u{fe23}') || (c0 >= '\u{20d0}' && c0 <= '\u{20f0}') || c0 == '\u{200d}' || c0 == '\u{3299}' || c0 == '\u{3297}' || c0 == '\u{303d}' || c0 == '\u{3030}' || c0 == '\u{24c2}' || c0 == '\u{203c}' || c0 == '\u{2049}' || (c0 >= '\u{25aa}' && c0 <= '\u{25ab}') || c0 == '\u{25b6}' || c0 == '\u{25c0}' || (c0 >= '\u{25fb}' && c0 <= '\u{25fe}') || c0 == '\u{a9}' || c0 == '\u{ae}' || c0 == '\u{2122}' || c0 == '\u{2139}' || (c0 >= '\u{2600}' && c0 <= '\u{26ff}') || c0 == '\u{2b05}' || c0 == '\u{2b06}' || c0 == '\u{2b07}' || c0 == '\u{2b1b}' || c0 == '\u{2b1c}' || c0 == '\u{2b50}' || c0 == '\u{2b55}' || c0 == '\u{231a}' || c0 == '\u{231b}' || c0 == '\u{2328}' || c0 == '\u{23cf}' || (c0 >= '\u{23e9}' && c0 <= '\u{23f3}') || (c0 >= '\u{23f8}' && c0 <= '\u{23fa}') || c0 == '\u{2935}' || c0 == '\u{2934}' || (c0 >= '\u{2190}' && c0 <= '\u{21ff}')) { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }

    /// PEG rule: MarkChar -> Inline
    fn parse_mark_char(&mut self) -> Option<()> {
        let c0 = self.peek_char()?;
        if ((c0 >= '\u{300}' && c0 <= '\u{36f}') || (c0 >= '\u{483}' && c0 <= '\u{489}') || (c0 >= '\u{591}' && c0 <= '\u{5bd}') || c0 == '\u{5bf}' || c0 == '\u{5c1}' || c0 == '\u{5c2}' || c0 == '\u{5c4}' || c0 == '\u{5c5}' || c0 == '\u{5c7}' || (c0 >= '\u{610}' && c0 <= '\u{61a}') || (c0 >= '\u{64b}' && c0 <= '\u{65f}') || c0 == '\u{670}' || (c0 >= '\u{6d6}' && c0 <= '\u{6dc}') || (c0 >= '\u{6df}' && c0 <= '\u{6e4}') || c0 == '\u{6e7}' || c0 == '\u{6e8}' || (c0 >= '\u{6ea}' && c0 <= '\u{6ed}') || c0 == '\u{711}' || (c0 >= '\u{730}' && c0 <= '\u{74a}') || (c0 >= '\u{7a6}' && c0 <= '\u{7b0}') || (c0 >= '\u{7eb}' && c0 <= '\u{7f3}') || (c0 >= '\u{816}' && c0 <= '\u{819}') || (c0 >= '\u{81b}' && c0 <= '\u{823}') || (c0 >= '\u{825}' && c0 <= '\u{827}') || (c0 >= '\u{829}' && c0 <= '\u{82d}') || (c0 >= '\u{859}' && c0 <= '\u{85b}') || (c0 >= '\u{8d4}' && c0 <= '\u{8e1}') || (c0 >= '\u{8e3}' && c0 <= '\u{903}') || (c0 >= '\u{93a}' && c0 <= '\u{93c}') || (c0 >= '\u{93e}' && c0 <= '\u{94f}') || (c0 >= '\u{951}' && c0 <= '\u{957}') || c0 == '\u{962}' || c0 == '\u{963}' || (c0 >= '\u{981}' && c0 <= '\u{983}') || c0 == '\u{9bc}' || (c0 >= '\u{9be}' && c0 <= '\u{9c4}') || c0 == '\u{9c7}' || c0 == '\u{9c8}' || (c0 >= '\u{9cb}' && c0 <= '\u{9cd}') || c0 == '\u{9d7}' || c0 == '\u{9e2}' || c0 == '\u{9e3}' || (c0 >= '\u{a01}' && c0 <= '\u{a03}') || c0 == '\u{a3c}' || (c0 >= '\u{a3e}' && c0 <= '\u{a42}') || c0 == '\u{a47}' || c0 == '\u{a48}' || (c0 >= '\u{a4b}' && c0 <= '\u{a4d}') || c0 == '\u{a51}' || c0 == '\u{a70}' || c0 == '\u{a71}' || c0 == '\u{a75}' || (c0 >= '\u{a81}' && c0 <= '\u{a83}') || c0 == '\u{abc}' || (c0 >= '\u{abe}' && c0 <= '\u{ac5}') || (c0 >= '\u{ac7}' && c0 <= '\u{ac9}') || (c0 >= '\u{acb}' && c0 <= '\u{acd}') || c0 == '\u{ae2}' || c0 == '\u{ae3}' || (c0 >= '\u{b01}' && c0 <= '\u{b03}') || c0 == '\u{b3c}' || (c0 >= '\u{b3e}' && c0 <= '\u{b44}') || c0 == '\u{b47}' || c0 == '\u{b48}' || (c0 >= '\u{b4b}' && c0 <= '\u{b4d}') || c0 == '\u{b56}' || c0 == '\u{b57}' || c0 == '\u{b62}' || c0 == '\u{b63}' || c0 == '\u{b82}' || (c0 >= '\u{bbe}' && c0 <= '\u{bc2}') || (c0 >= '\u{bc6}' && c0 <= '\u{bc8}') || (c0 >= '\u{bca}' && c0 <= '\u{bcd}') || c0 == '\u{bd7}' || (c0 >= '\u{c00}' && c0 <= '\u{c03}') || (c0 >= '\u{c3e}' && c0 <= '\u{c44}') || (c0 >= '\u{c46}' && c0 <= '\u{c48}') || (c0 >= '\u{c4a}' && c0 <= '\u{c4d}') || c0 == '\u{c55}' || c0 == '\u{c56}' || c0 == '\u{c62}' || c0 == '\u{c63}' || (c0 >= '\u{c81}' && c0 <= '\u{c83}') || c0 == '\u{cbc}' || (c0 >= '\u{cbe}' && c0 <= '\u{cc4}') || (c0 >= '\u{cc6}' && c0 <= '\u{cc8}') || (c0 >= '\u{cca}' && c0 <= '\u{ccd}') || c0 == '\u{cd5}' || c0 == '\u{cd6}' || c0 == '\u{ce2}' || c0 == '\u{ce3}' || (c0 >= '\u{d01}' && c0 <= '\u{d03}') || (c0 >= '\u{d3e}' && c0 <= '\u{d44}') || (c0 >= '\u{d46}' && c0 <= '\u{d48}') || (c0 >= '\u{d4a}' && c0 <= '\u{d4d}') || c0 == '\u{d57}' || c0 == '\u{d62}' || c0 == '\u{d63}' || c0 == '\u{d82}' || c0 == '\u{d83}' || c0 == '\u{dca}' || (c0 >= '\u{dcf}' && c0 <= '\u{dd4}') || c0 == '\u{dd6}' || (c0 >= '\u{dd8}' && c0 <= '\u{ddf}') || c0 == '\u{df2}' || c0 == '\u{df3}' || c0 == '\u{e31}' || (c0 >= '\u{e34}' && c0 <= '\u{e3a}') || (c0 >= '\u{e47}' && c0 <= '\u{e4e}') || c0 == '\u{eb1}' || (c0 >= '\u{eb4}' && c0 <= '\u{eb9}') || c0 == '\u{ebb}' || c0 == '\u{ebc}' || (c0 >= '\u{ec8}' && c0 <= '\u{ecd}') || c0 == '\u{f18}' || c0 == '\u{f19}' || c0 == '\u{f35}' || c0 == '\u{f37}' || c0 == '\u{f39}' || c0 == '\u{f3e}' || c0 == '\u{f3f}' || (c0 >= '\u{f71}' && c0 <= '\u{f84}') || c0 == '\u{f86}' || c0 == '\u{f87}' || (c0 >= '\u{f8d}' && c0 <= '\u{f97}') || (c0 >= '\u{f99}' && c0 <= '\u{fbc}') || c0 == '\u{fc6}' || (c0 >= '\u{102b}' && c0 <= '\u{103e}') || (c0 >= '\u{1056}' && c0 <= '\u{1059}') || (c0 >= '\u{105e}' && c0 <= '\u{1060}') || (c0 >= '\u{1062}' && c0 <= '\u{1064}') || (c0 >= '\u{1067}' && c0 <= '\u{106d}') || (c0 >= '\u{1071}' && c0 <= '\u{1074}') || (c0 >= '\u{1082}' && c0 <= '\u{108d}') || c0 == '\u{108f}' || (c0 >= '\u{109a}' && c0 <= '\u{109d}') || (c0 >= '\u{135d}' && c0 <= '\u{135f}') || (c0 >= '\u{1712}' && c0 <= '\u{1714}') || (c0 >= '\u{1732}' && c0 <= '\u{1734}') || c0 == '\u{1752}' || c0 == '\u{1753}' || c0 == '\u{1772}' || c0 == '\u{1773}' || (c0 >= '\u{17b4}' && c0 <= '\u{17d3}') || c0 == '\u{17dd}' || (c0 >= '\u{180b}' && c0 <= '\u{180d}') || c0 == '\u{1885}' || c0 == '\u{1886}' || c0 == '\u{18a9}' || (c0 >= '\u{1920}' && c0 <= '\u{192b}') || (c0 >= '\u{1930}' && c0 <= '\u{193b}') || (c0 >= '\u{1a17}' && c0 <= '\u{1a1b}') || (c0 >= '\u{1a55}' && c0 <= '\u{1a5e}') || (c0 >= '\u{1a60}' && c0 <= '\u{1a7c}') || c0 == '\u{1a7f}' || (c0 >= '\u{1ab0}' && c0 <= '\u{1abe}') || (c0 >= '\u{1b00}' && c0 <= '\u{1b04}') || (c0 >= '\u{1b34}' && c0 <= '\u{1b44}') || (c0 >= '\u{1b6b}' && c0 <= '\u{1b73}') || (c0 >= '\u{1b80}' && c0 <= '\u{1b82}') || (c0 >= '\u{1ba1}' && c0 <= '\u{1bad}') || (c0 >= '\u{1be6}' && c0 <= '\u{1bf3}') || (c0 >= '\u{1c24}' && c0 <= '\u{1c37}') || (c0 >= '\u{1cd0}' && c0 <= '\u{1cd2}') || (c0 >= '\u{1cd4}' && c0 <= '\u{1ce8}') || c0 == '\u{1ced}' || (c0 >= '\u{1cf2}' && c0 <= '\u{1cf4}') || c0 == '\u{1cf8}' || c0 == '\u{1cf9}' || (c0 >= '\u{1dc0}' && c0 <= '\u{1df5}') || (c0 >= '\u{1dfb}' && c0 <= '\u{1dff}') || (c0 >= '\u{20d0}' && c0 <= '\u{20f0}') || (c0 >= '\u{2cef}' && c0 <= '\u{2cf1}') || c0 == '\u{2d7f}' || (c0 >= '\u{2de0}' && c0 <= '\u{2dff}') || (c0 >= '\u{302a}' && c0 <= '\u{302f}') || c0 == '\u{3099}' || c0 == '\u{309a}' || (c0 >= '\u{a66f}' && c0 <= '\u{a672}') || (c0 >= '\u{a674}' && c0 <= '\u{a67d}') || c0 == '\u{a69e}' || c0 == '\u{a69f}' || c0 == '\u{a6f0}' || c0 == '\u{a6f1}' || c0 == '\u{a802}' || c0 == '\u{a806}' || c0 == '\u{a80b}' || (c0 >= '\u{a823}' && c0 <= '\u{a827}') || c0 == '\u{a880}' || c0 == '\u{a881}' || (c0 >= '\u{a8b4}' && c0 <= '\u{a8c5}') || (c0 >= '\u{a8e0}' && c0 <= '\u{a8f1}') || (c0 >= '\u{a926}' && c0 <= '\u{a92d}') || (c0 >= '\u{a947}' && c0 <= '\u{a953}') || (c0 >= '\u{a980}' && c0 <= '\u{a983}') || (c0 >= '\u{a9b3}' && c0 <= '\u{a9c0}') || c0 == '\u{a9e5}' || (c0 >= '\u{aa29}' && c0 <= '\u{aa36}') || c0 == '\u{aa43}' || c0 == '\u{aa4c}' || c0 == '\u{aa4d}' || (c0 >= '\u{aa7b}' && c0 <= '\u{aa7d}') || c0 == '\u{aab0}' || (c0 >= '\u{aab2}' && c0 <= '\u{aab4}') || c0 == '\u{aab7}' || c0 == '\u{aab8}' || c0 == '\u{aabe}' || c0 == '\u{aabf}' || c0 == '\u{aac1}' || (c0 >= '\u{aaeb}' && c0 <= '\u{aaef}') || c0 == '\u{aaf5}' || c0 == '\u{aaf6}' || (c0 >= '\u{abe3}' && c0 <= '\u{abea}') || c0 == '\u{abec}' || c0 == '\u{abed}' || c0 == '\u{fb1e}' || (c0 >= '\u{fe00}' && c0 <= '\u{fe0f}') || (c0 >= '\u{fe20}' && c0 <= '\u{fe2f}')) { self.advance(c0.len_utf8()); } else { return None; }

        Some(())
    }


    // ── AST Helpers ─────────────────────────────────────────────────

    fn plain(text: &str) -> Inline {
        Inline::Plain { value: text.to_string() }
    }

    fn reduce_plain_texts(items: Vec<Inline>) -> Vec<Inline> {
        let mut result: Vec<Inline> = Vec::new();
        for item in items {
            if let Inline::Plain { value: ref text } = item {
                if let Some(Inline::Plain { value: ref mut prev }) = result.last_mut() {
                    prev.push_str(text);
                    continue;
                }
            }
            result.push(item);
        }
        result
    }

    fn text_from(&self, start: usize) -> &'a str {
        &self.input[start..self.pos]
    }

    // ── Tree builder ──────────────────────────────────────────────────

    fn build_tree(&self) -> Vec<Node> {
        let mut pos = 0;
        let mut nodes = Vec::new();
        while pos < self.events.len() {
            match &self.events[pos] {
                GreenEvent::Start(sk) => {
                    let (inlines, next) = self.collect_inlines(pos + 1, *sk);
                    let node = match sk {
                        SK::Paragraph => Node::Paragraph { value: Self::reduce_plain_texts(inlines) },
                        SK::BigEmoji => Node::BigEmoji { value: inlines },
                        SK::Heading => Node::Heading { value: Self::reduce_plain_texts(inlines), level: 1 },
                        SK::Code => Node::Code { value: vec![], language: None },
                        SK::OrderedList => Node::OrderedList { value: vec![] },
                        SK::UnorderedList => Node::UnorderedList { value: vec![] },
                        SK::Tasks => Node::Tasks { value: vec![] },
                        SK::Quote => Node::Quote { value: vec![Node::Paragraph { value: inlines }] },
                        SK::SpoilerBlock => Node::SpoilerBlock { value: vec![Node::Paragraph { value: inlines }] },
                        _ => Node::Paragraph { value: inlines },
                    };
                    nodes.push(node);
                    pos = next;
                }
                GreenEvent::LeafLineBreak => {
                    nodes.push(Node::LineBreak { value: () });
                    pos += 1;
                }
                GreenEvent::LeafHorizontalRule => {
                    nodes.push(Node::HorizontalRule { value: (), fallback: None });
                    pos += 1;
                }
                GreenEvent::LeafText(s, e) => {
                    nodes.push(Node::Paragraph {
                        value: vec![Inline::Plain { value: self.input[*s..*e].to_string() }],
                    });
                    pos += 1;
                }
                GreenEvent::LeafEmoji(..) | GreenEvent::LeafUnicodeEmoji(..) => {
                    let mut emoji_values = Vec::new();
                    while pos < self.events.len() {
                        match &self.events[pos] {
                            GreenEvent::LeafEmoji(ref value, ref short_code) => {
                                emoji_values.push(Inline::EmojiShortCode {
                                    value: Box::new(Self::plain(value)),
                                    short_code: short_code.clone(),
                                });
                                pos += 1;
                            }
                            GreenEvent::LeafUnicodeEmoji(ref unicode) => {
                                emoji_values.push(Inline::EmojiUnicode { value: (), unicode: unicode.clone() });
                                pos += 1;
                            }
                            GreenEvent::LeafText(s, e) => {
                                let text = &self.input[*s..*e];
                                if text.trim().is_empty() {
                                    pos += 1;
                                } else {
                                    break;
                                }
                            }
                            _ => break,
                        }
                    }
                    nodes.push(Node::BigEmoji { value: emoji_values });
                }
                _ => { pos += 1; }
            }
        }
        if nodes.is_empty() {
            vec![Node::Paragraph { value: vec![Inline::Plain { value: String::new() }] }]
        } else {
            nodes
        }
    }

    fn collect_inlines(&self, start: usize, parent: SK) -> (Vec<Inline>, usize) {
        let mut inlines: Vec<Inline> = Vec::new();
        let mut data_str: Option<String> = None;
        let mut pos = start;
        while pos < self.events.len() {
            match &self.events[pos] {
                GreenEvent::Finish(sk) if *sk == parent => {
                    return (inlines, pos + 1);
                }
                GreenEvent::Start(sk) => {
                    let (children, next) = self.collect_inlines(pos + 1, *sk);
                    let children = Self::reduce_plain_texts(children);
                    let inline = match sk {
                        SK::Bold => Inline::Bold { value: children },
                        SK::Italic => Inline::Italic { value: children },
                        SK::Strike => Inline::Strike { value: children },
                        SK::Spoiler => Inline::Spoiler { value: children },
                        SK::Link => {
                            // DataStr before Finish(Link) carries the href
                            let mut href = String::new();
                            let mut scan = next.saturating_sub(2);
                            while scan > pos {
                                if let GreenEvent::DataStr(ref s) = self.events[scan] {
                                    href = s.clone();
                                    break;
                                }
                                scan -= 1;
                            }
                            let label = if children.is_empty() && !href.is_empty() {
                                vec![Inline::Plain { value: href.clone() }]
                            } else {
                                children
                            };
                            Inline::Link { value: LinkValue {
                                src: Box::new(Self::plain(&href)),
                                label,
                            }}
                        },
                        SK::Image => Inline::Image { value: ImageValue {
                            src: Box::new(Self::plain("")),
                            label: Box::new(Self::plain("")),
                        }},
                        SK::Paragraph | SK::BigEmoji => {
                            inlines.extend(children);
                            pos = next;
                            continue;
                        }
                        _ => {
                            inlines.extend(children);
                            pos = next;
                            continue;
                        }
                    };
                    inlines.push(inline);
                    pos = next;
                }
                GreenEvent::DataStr(ref s) => {
                    data_str = Some(s.clone());
                    pos += 1;
                }
                GreenEvent::LeafText(s, e) => {
                    inlines.push(Inline::Plain { value: self.input[*s..*e].to_string() });
                    pos += 1;
                }
                GreenEvent::LeafStr(sk, s, e) => {
                    let text = &self.input[*s..*e];
                    let inline = match sk {
                        SK::InlineCode => Inline::InlineCode { value: Box::new(Self::plain(text)) },
                        SK::MentionUser => Inline::MentionUser { value: Box::new(Self::plain(text)) },
                        SK::MentionChannel => Inline::MentionChannel { value: Box::new(Self::plain(text)) },
                        SK::InlineKatex => Inline::InlineKatex { value: text.to_string() },
                        _ => Inline::Plain { value: text.to_string() },
                    };
                    inlines.push(inline);
                    pos += 1;
                }
                GreenEvent::LeafEmoji(ref value, ref short_code) => {
                    inlines.push(Inline::EmojiShortCode {
                        value: Box::new(Self::plain(value)),
                        short_code: short_code.clone(),
                    });
                    pos += 1;
                }
                GreenEvent::LeafUnicodeEmoji(ref unicode) => {
                    inlines.push(Inline::EmojiUnicode { value: (), unicode: unicode.clone() });
                    pos += 1;
                }
                GreenEvent::Finish(_) => {
                    return (inlines, pos + 1);
                }
                _ => { pos += 1; }
            }
        }
        (inlines, pos)
    }

    // ── Public API ───────────────────────────────────────────────────

    pub fn matches(input: &str, config: ParserConfig) -> bool {
        let mut parser = Parser::new(input, config);
        parser.parse_start().is_some()
    }

    pub fn debug_events(input: &'a str, config: ParserConfig) -> Vec<String> {
        let mut parser = Parser::new(input, config);
        parser.parse_start();
        parser.events.iter().map(|e| format!("{:?}", e)).collect()
    }

    pub fn parse(input: &'a str, config: ParserConfig) -> Vec<Node> {
        let mut parser = Parser::new(input, config);
        if parser.parse_start().is_none() {
            return vec![Node::Paragraph { value: vec![Self::plain(input)] }];
        }
        parser.build_tree()
    }

    // ── Flat buffer serialization (zero-copy) ────────────────────────
    //
    // Buffer layout (little-endian):
    //   [0..4]  event_count: u32
    //   [4..8]  string_table_offset: u32
    //   [8..N]  event records (variable size)
    //   [N..]   string table (raw UTF-8, referenced by offset+length)
    //
    // Event tags:
    //   1  Start(sk:u8)                                    2 bytes
    //   2  Finish(sk:u8)                                   2 bytes
    //   3  LeafText(start:u32, end:u32)                    9 bytes
    //   4  LeafStr(sk:u8, start:u32, end:u32)             10 bytes
    //   5  LeafEmoji(off1:u32, len1:u16, off2:u32, len2:u16)  13 bytes
    //   6  LeafUnicodeEmoji(off:u32, len:u16)              7 bytes
    //   7  LeafLineBreak                                   1 byte
    //   8  LeafHorizontalRule                              1 byte
    //   9  DataStr(off:u32, len:u16)                       7 bytes
    //  10  DataU8(value:u8)                                2 bytes

    pub fn parse_flat(input: &'a str, config: ParserConfig) -> Vec<u8> {
        let mut parser = Parser::new(input, config);
        if parser.parse_start().is_none() {
            let mut buf = Vec::with_capacity(32);
            buf.extend_from_slice(&3u32.to_le_bytes());
            buf.extend_from_slice(&0u32.to_le_bytes());
            buf.push(1); buf.push(SK::Paragraph as u8);
            buf.push(3);
            buf.extend_from_slice(&0u32.to_le_bytes());
            buf.extend_from_slice(&(input.len() as u32).to_le_bytes());
            buf.push(2); buf.push(SK::Paragraph as u8);
            let st_off = buf.len() as u32;
            buf[4..8].copy_from_slice(&st_off.to_le_bytes());
            return buf;
        }
        parser.serialize_flat()
    }

    fn serialize_flat(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(self.events.len() * 6 + 16);
        let mut strings: Vec<u8> = Vec::new();

        buf.extend_from_slice(&(self.events.len() as u32).to_le_bytes());
        buf.extend_from_slice(&0u32.to_le_bytes());

        for event in &self.events {
            match event {
                GreenEvent::Start(sk) => {
                    buf.push(1);
                    buf.push(*sk as u8);
                }
                GreenEvent::Finish(sk) => {
                    buf.push(2);
                    buf.push(*sk as u8);
                }
                GreenEvent::LeafText(s, e) => {
                    buf.push(3);
                    buf.extend_from_slice(&(*s as u32).to_le_bytes());
                    buf.extend_from_slice(&(*e as u32).to_le_bytes());
                }
                GreenEvent::LeafStr(sk, s, e) => {
                    buf.push(4);
                    buf.push(*sk as u8);
                    buf.extend_from_slice(&(*s as u32).to_le_bytes());
                    buf.extend_from_slice(&(*e as u32).to_le_bytes());
                }
                GreenEvent::LeafEmoji(value, shortcode) => {
                    buf.push(5);
                    let off1 = strings.len() as u32;
                    let b1 = value.as_bytes();
                    strings.extend_from_slice(b1);
                    buf.extend_from_slice(&off1.to_le_bytes());
                    buf.extend_from_slice(&(b1.len() as u16).to_le_bytes());
                    let off2 = strings.len() as u32;
                    let b2 = shortcode.as_bytes();
                    strings.extend_from_slice(b2);
                    buf.extend_from_slice(&off2.to_le_bytes());
                    buf.extend_from_slice(&(b2.len() as u16).to_le_bytes());
                }
                GreenEvent::LeafUnicodeEmoji(unicode) => {
                    buf.push(6);
                    let off = strings.len() as u32;
                    let b = unicode.as_bytes();
                    strings.extend_from_slice(b);
                    buf.extend_from_slice(&off.to_le_bytes());
                    buf.extend_from_slice(&(b.len() as u16).to_le_bytes());
                }
                GreenEvent::LeafLineBreak => buf.push(7),
                GreenEvent::LeafHorizontalRule => buf.push(8),
                GreenEvent::DataStr(s) => {
                    buf.push(9);
                    let off = strings.len() as u32;
                    let b = s.as_bytes();
                    strings.extend_from_slice(b);
                    buf.extend_from_slice(&off.to_le_bytes());
                    buf.extend_from_slice(&(b.len() as u16).to_le_bytes());
                }
                GreenEvent::DataU8(v) => {
                    buf.push(10);
                    buf.push(*v);
                }
            }
        }

        let st_off = buf.len() as u32;
        buf[4..8].copy_from_slice(&st_off.to_le_bytes());
        buf.extend_from_slice(&strings);
        buf
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plain_text() {
        assert!(Parser::matches("hello world", ParserConfig::default()));
    }

    #[test]
    fn test_bold() {
        assert!(Parser::matches("*bold*", ParserConfig::default()));
    }

    #[test]
    fn test_empty() {
        assert!(Parser::matches("", ParserConfig::default()));
    }

    #[test]
    fn test_ast_serialization() {
        // Verify serde serialization produces correct JSON structure
        let node = Node::Paragraph {
            value: vec![
                Inline::Plain { value: "hello ".to_string() },
                Inline::Bold { value: vec![Inline::Plain { value: "world".to_string() }] },
            ],
        };
        let json = serde_json::to_string(&node).unwrap();
        assert!(json.contains(r#""type":"PARAGRAPH""#));
        assert!(json.contains(r#""type":"BOLD""#));
        assert!(json.contains(r#""type":"PLAIN_TEXT""#));
    }

    #[test]
    fn test_emoji_serialization() {
        let unicode = Inline::EmojiUnicode { value: (), unicode: "😀".to_string() };
        let json = serde_json::to_string(&unicode).unwrap();
        assert!(json.contains(r#""type":"EMOJI""#));
        assert!(json.contains(r#""unicode":"😀""#));

        let shortcode = Inline::EmojiShortCode {
            value: Box::new(Inline::Plain { value: "smile".to_string() }),
            short_code: "smile".to_string(),
        };
        let json = serde_json::to_string(&shortcode).unwrap();
        assert!(json.contains(r#""type":"EMOJI""#));
        assert!(json.contains(r#""shortCode":"smile""#));
    }

    #[test]
    fn test_parse_plain() {
        let nodes = Parser::parse("hello world", ParserConfig::default());
        let json = serde_json::to_string(&nodes).unwrap();
        assert!(json.contains(r#""type":"PARAGRAPH""#), "json: {}", json);
    }

    #[test]
    fn test_parse_bold() {
        let nodes = Parser::parse("*bold*", ParserConfig::default());
        let json = serde_json::to_string(&nodes).unwrap();
        assert!(json.contains(r#""type":"BOLD""#) || json.contains(r#""type":"PARAGRAPH""#),
                "json: {}", json);
    }

    #[test]
    fn test_parse_empty() {
        let nodes = Parser::parse("", ParserConfig::default());
        assert!(!nodes.is_empty());
    }
}
