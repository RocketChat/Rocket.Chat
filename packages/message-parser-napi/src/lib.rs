use logos::Logos;
use napi_derive::napi;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum Node {
    #[serde(rename = "PARAGRAPH")]
    Paragraph { value: Vec<Inline> },
    #[serde(rename = "BIG_EMOJI")]
    BigEmoji { value: Vec<Inline> },
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
    Emoji {
        value: Box<Inline>,
        #[serde(rename = "shortCode")]
        short_code: String,
    },
    #[serde(rename = "MENTION_USER")]
    MentionUser { value: Box<Inline> },
    #[serde(rename = "MENTION_CHANNEL")]
    MentionChannel { value: Box<Inline> },
    #[serde(rename = "LINK")]
    Link { value: LinkValue },
}

#[derive(Debug, Clone, Serialize)]
pub struct LinkValue {
    pub src: Box<Inline>,
    pub label: Vec<Inline>,
}

fn plain(s: &str) -> Inline {
    Inline::Plain {
        value: s.to_string(),
    }
}

#[derive(Logos, Debug, Clone, PartialEq)]
#[logos(skip r"")]
enum Token {
    #[token("**")]
    DoubleStar,
    #[token("*")]
    Star,
    #[token("__")]
    DoubleUnderscore,
    #[token("_")]
    Underscore,
    #[token("~~")]
    DoubleTilde,
    #[token("~")]
    Tilde,
    #[token("`")]
    Backtick,
    #[token("@")]
    At,
    #[token("#")]
    Hash,
    #[token("[")]
    LBracket,
    #[token("]")]
    RBracket,
    #[token("(")]
    LParen,
    #[token(")")]
    RParen,
    #[regex(r":[a-zA-Z0-9_]+:")]
    EmojiShortcode,
    #[regex(r"[a-zA-Z0-9_.+-]+", priority = 1)]
    Word,
    #[regex(r"[ \t]+")]
    Whitespace,
    #[regex(r"[^\*_~`@#\[\]\(\): \t\na-zA-Z0-9_.+-]+")]
    Other,
    #[token("\n")]
    Newline,
    #[token(":")]
    Colon,
}

#[derive(Debug, Clone)]
struct Span {
    token: Token,
    text: String,
}

fn tokenize(input: &str) -> Vec<Span> {
    let mut spans = Vec::new();
    let mut lex = Token::lexer(input);
    while let Some(result) = lex.next() {
        let text = lex.slice().to_string();
        match result {
            Ok(token) => spans.push(Span { token, text }),
            Err(()) => spans.push(Span {
                token: Token::Other,
                text,
            }),
        }
    }
    spans
}

struct Parser {
    spans: Vec<Span>,
    pos: usize,
}

impl Parser {
    fn new(input: &str) -> Self {
        Self {
            spans: tokenize(input),
            pos: 0,
        }
    }

    fn at_end(&self) -> bool {
        self.pos >= self.spans.len()
    }

    fn peek(&self) -> Option<&Token> {
        self.spans.get(self.pos).map(|s| &s.token)
    }

    fn peek_text(&self) -> &str {
        self.spans
            .get(self.pos)
            .map(|s| s.text.as_str())
            .unwrap_or("")
    }

    fn advance(&mut self) -> &Span {
        let s = &self.spans[self.pos];
        self.pos += 1;
        s
    }

    fn char_before(&self, span_idx: usize) -> Option<char> {
        if span_idx == 0 {
            return None;
        }
        self.spans[span_idx - 1].text.chars().last()
    }

    fn parse_document(&mut self) -> Vec<Node> {
        let items = self.parse_inlines();
        let items = reduce_plain_texts(items);

        if items.is_empty() {
            return vec![];
        }

        let non_empty: Vec<_> = items
            .iter()
            .filter(|n| !matches!(n, Inline::Plain { value } if value.is_empty()))
            .collect();
        if !non_empty.is_empty()
            && non_empty.len() <= 3
            && non_empty.iter().all(|n| matches!(n, Inline::Emoji { .. }))
        {
            let emojis: Vec<Inline> = items
                .into_iter()
                .filter(|n| matches!(n, Inline::Emoji { .. }))
                .collect();
            return vec![Node::BigEmoji { value: emojis }];
        }

        vec![Node::Paragraph { value: items }]
    }

    fn parse_inlines(&mut self) -> Vec<Inline> {
        let mut items = Vec::new();
        while !self.at_end() {
            if let Some(inline) = self.parse_inline() {
                items.push(inline);
            }
        }
        items
    }

    fn parse_inline(&mut self) -> Option<Inline> {
        match self.peek()? {
            Token::DoubleStar => self.try_bold_double(),
            Token::Star => self.try_bold_single(),
            Token::DoubleUnderscore => self.try_italic_double(),
            Token::Underscore => self.try_italic_single(),
            Token::DoubleTilde => self.try_strike_double(),
            Token::Tilde => self.try_strike_single(),
            Token::Backtick => self.try_inline_code(),
            Token::EmojiShortcode => self.parse_emoji(),
            Token::At => self.try_mention_user(),
            Token::Hash => self.try_mention_channel(),
            Token::LBracket => self.try_link(),
            _ => {
                let s = self.advance();
                Some(plain(&s.text))
            }
        }
    }

    fn try_bold_double(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let content = self.parse_until_token(Token::DoubleStar, true);
        if self.peek() == Some(&Token::DoubleStar) {
            self.pos += 1;
            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("**"));
            }
            Some(Inline::Bold { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("**"))
        }
    }

    fn try_bold_single(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let content = self.parse_until_token(Token::Star, true);
        if self.peek() == Some(&Token::Star) {
            self.pos += 1;
            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("*"));
            }
            Some(Inline::Bold { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("*"))
        }
    }

    fn try_italic_double(&mut self) -> Option<Inline> {
        let start = self.pos;

        if let Some(ch) = self.char_before(self.pos) {
            if ch.is_alphanumeric() {
                self.pos += 1;
                return Some(plain("__"));
            }
        }

        self.pos += 1;

        let content = self.parse_until_token(Token::DoubleUnderscore, false);
        if self.peek() == Some(&Token::DoubleUnderscore) {
            self.pos += 1;

            if let Some(ch) = self.spans.get(self.pos).and_then(|s| s.text.chars().next()) {
                if ch.is_alphanumeric() {
                    self.pos = start + 1;
                    return Some(plain("__"));
                }
            }

            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("____"));
            }
            Some(Inline::Italic { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("__"))
        }
    }

    fn try_italic_single(&mut self) -> Option<Inline> {
        let start = self.pos;

        if let Some(ch) = self.char_before(self.pos) {
            if ch.is_alphanumeric() {
                self.pos += 1;
                return Some(plain("_"));
            }
        }

        self.pos += 1;

        let content = self.parse_until_token(Token::Underscore, false);
        if self.peek() == Some(&Token::Underscore) {
            self.pos += 1;

            if let Some(ch) = self.spans.get(self.pos).and_then(|s| s.text.chars().next()) {
                if ch.is_alphabetic() {
                    self.pos = start + 1;
                    return Some(plain("_"));
                }
            }

            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("__"));
            }
            Some(Inline::Italic { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("_"))
        }
    }

    fn try_strike_double(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let content = self.parse_until_token(Token::DoubleTilde, true);
        if self.peek() == Some(&Token::DoubleTilde) {
            self.pos += 1;
            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("~~"));
            }
            Some(Inline::Strike { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("~~"))
        }
    }

    fn try_strike_single(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let content = self.parse_until_token(Token::Tilde, true);
        if self.peek() == Some(&Token::Tilde) {
            self.pos += 1;
            let content = reduce_plain_texts(content);
            if content.is_empty() {
                return Some(plain("~"));
            }
            Some(Inline::Strike { value: content })
        } else {
            self.pos = start + 1;
            Some(plain("~"))
        }
    }

    fn try_inline_code(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let mut code_text = String::new();
        while !self.at_end() {
            if self.peek() == Some(&Token::Backtick) {
                self.pos += 1;
                return Some(Inline::InlineCode {
                    value: Box::new(plain(&code_text)),
                });
            }
            if self.peek() == Some(&Token::Newline) {
                break;
            }
            let s = self.advance();
            code_text.push_str(&s.text);
        }

        self.pos = start + 1;
        Some(plain("`"))
    }

    fn parse_emoji(&mut self) -> Option<Inline> {
        let s = self.advance();
        let text = &s.text;
        let code = &text[1..text.len() - 1];
        Some(Inline::Emoji {
            value: Box::new(plain(code)),
            short_code: code.to_string(),
        })
    }

    fn try_mention_user(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let mut name = String::new();
        while !self.at_end() {
            match self.peek() {
                Some(Token::Word) => {
                    name.push_str(&self.advance().text);
                }
                Some(Token::Other) if self.peek_text() == "-" || self.peek_text() == "." => {
                    name.push_str(&self.advance().text);
                }
                _ => break,
            }
        }

        if name.is_empty() || name.ends_with("__") {
            self.pos = start + 1;
            Some(plain("@"))
        } else {
            Some(Inline::MentionUser {
                value: Box::new(plain(&name)),
            })
        }
    }

    fn try_mention_channel(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let mut name = String::new();
        while !self.at_end() {
            match self.peek() {
                Some(Token::Word) => {
                    name.push_str(&self.advance().text);
                }
                Some(Token::Other) if self.peek_text() == "-" || self.peek_text() == "." => {
                    name.push_str(&self.advance().text);
                }
                _ => break,
            }
        }

        if name.is_empty() {
            self.pos = start + 1;
            Some(plain("#"))
        } else {
            Some(Inline::MentionChannel {
                value: Box::new(plain(&name)),
            })
        }
    }

    fn try_link(&mut self) -> Option<Inline> {
        let start = self.pos;
        self.pos += 1;

        let mut label = String::new();
        while !self.at_end() {
            if self.peek() == Some(&Token::RBracket) {
                self.pos += 1;
                break;
            }
            if self.peek() == Some(&Token::Newline) {
                self.pos = start + 1;
                return Some(plain("["));
            }
            label.push_str(&self.advance().text);
        }

        if self.peek() != Some(&Token::LParen) {
            self.pos = start + 1;
            return Some(plain("["));
        }
        self.pos += 1;

        let mut url = String::new();
        while !self.at_end() {
            if self.peek() == Some(&Token::RParen) {
                self.pos += 1;
                break;
            }
            if self.peek() == Some(&Token::Newline) {
                self.pos = start + 1;
                return Some(plain("["));
            }
            url.push_str(&self.advance().text);
        }

        if url.is_empty() {
            self.pos = start + 1;
            return Some(plain("["));
        }

        Some(Inline::Link {
            value: LinkValue {
                src: Box::new(plain(&url)),
                label: if label.is_empty() {
                    vec![plain(&url)]
                } else {
                    vec![plain(&label)]
                },
            },
        })
    }

    fn parse_until_token(&mut self, end_token: Token, allow_nesting: bool) -> Vec<Inline> {
        let mut items = Vec::new();
        while !self.at_end() {
            if self.peek() == Some(&end_token) {
                break;
            }
            if self.peek() == Some(&Token::Newline) {
                break;
            }
            if allow_nesting {
                if let Some(inline) = self.parse_inline_nested(&end_token) {
                    items.push(inline);
                    continue;
                }
            }
            let s = self.advance();
            items.push(plain(&s.text));
        }
        items
    }

    fn parse_inline_nested(&mut self, skip_token: &Token) -> Option<Inline> {
        let tok = self.peek()?;
        if tok == skip_token {
            return None;
        }
        match tok {
            Token::DoubleTilde => self.try_strike_double(),
            Token::Tilde => self.try_strike_single(),
            Token::Backtick => self.try_inline_code(),
            Token::EmojiShortcode => self.parse_emoji(),
            Token::At => self.try_mention_user(),
            Token::Hash => self.try_mention_channel(),
            Token::LBracket => self.try_link(),
            Token::DoubleUnderscore if *skip_token != Token::DoubleUnderscore => {
                self.try_italic_double()
            }
            Token::Underscore if *skip_token != Token::Underscore => self.try_italic_single(),
            Token::DoubleStar if *skip_token != Token::DoubleStar => self.try_bold_double(),
            Token::Star if *skip_token != Token::Star => self.try_bold_single(),
            _ => {
                let s = self.advance();
                Some(plain(&s.text))
            }
        }
    }
}

fn reduce_plain_texts(mut items: Vec<Inline>) -> Vec<Inline> {
    if items.len() <= 1 {
        return items;
    }
    let mut result: Vec<Inline> = Vec::with_capacity(items.len());
    for item in items.drain(..) {
        match (&mut result.last_mut(), &item) {
            (Some(Inline::Plain { value: ref mut prev }), Inline::Plain { value: ref curr }) => {
                prev.push_str(curr);
            }
            _ => result.push(item),
        }
    }
    result
}

pub fn do_parse(input: &str) -> Vec<Node> {
    if input.is_empty() {
        return vec![Node::Paragraph {
            value: vec![plain("")],
        }];
    }
    let mut parser = Parser::new(input);
    parser.parse_document()
}

#[napi]
pub fn parse(input: String) -> napi::Result<serde_json::Value> {
    let result = do_parse(&input);
    serde_json::to_value(&result).map_err(|e| napi::Error::from_reason(e.to_string()))
}
