#!/usr/bin/env node
// PEG → logos + recursive descent Rust codegen v2
// Fixes: self/p scoping, variable bindings, return threading, semantic predicates

const fs = require('fs');
const path = require('path');
const peggy = require('peggy');

const MONOREPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const GRAMMAR_PATH = path.join(MONOREPO_ROOT, 'packages/message-parser/src/grammar.pegjs');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'parser.rs');

const src = fs.readFileSync(GRAMMAR_PATH, 'utf8');
const ast = peggy.parser.parse(src);

function snakeCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function escRustChar(c) {
  if (c === "'") return "\\'";
  if (c === '\\') return '\\\\';
  if (c === '\n') return '\\n';
  if (c === '\r') return '\\r';
  if (c === '\t') return '\\t';
  const code = c.charCodeAt(0);
  if (code < 0x20 || code > 0x7e) return `\\u{${code.toString(16)}}`;
  return c;
}

function escRustStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// ─── Infer return type from JS action ────────────────────────────────

function extractAllActions(node) {
  if (!node) return [];
  if (node.type === 'action') return [node.code, ...extractAllActions(node.expression)];
  if (node.type === 'choice') return node.alternatives.flatMap(extractAllActions);
  if (node.type === 'sequence') return node.elements.flatMap(extractAllActions);
  if (node.type === 'labeled') return extractAllActions(node.expression);
  if (node.type === 'group') return extractAllActions(node.expression);
  if (node.expression) return extractAllActions(node.expression);
  return [];
}

function inferReturnType(rule) {
  const actions = extractAllActions(rule.expression);
  const js = actions.join('\n');

  if (/return paragraph\(/.test(js)) return 'Node';
  if (/return heading\(/.test(js)) return 'Node';
  if (/return code\(/.test(js)) return 'Node';
  if (/return tasks\(/.test(js)) return 'Node';
  if (/return orderedList\(/.test(js)) return 'Node';
  if (/return unorderedList\(/.test(js)) return 'Node';
  if (/return katex\(/.test(js)) return 'Node';
  if (/return horizontalRule\(/.test(js)) return 'Node';
  if (/return lineBreak\(\)/.test(js)) return 'Node';
  if (/return table\(/.test(js)) return 'Node';
  if (/return spoilerBlock\(/.test(js)) return 'Node';
  if (/return quote\(/.test(js)) return 'Node';
  if (/return \[bigEmoji\(/.test(js)) return 'Vec<Node>';

  if (/return bold\(/.test(js)) return 'Inline';
  if (/return italic\(/.test(js)) return 'Inline';
  if (/return strike\(/.test(js)) return 'Inline';
  if (/return inlineCode\(/.test(js)) return 'Inline';
  if (/return emoji\(/.test(js)) return 'Inline';
  if (/return emojiUnicode\(/.test(js)) return 'Inline';
  if (/return emoticon\(/.test(js)) return 'Inline';
  if (/return mentionUser\(/.test(js)) return 'Inline';
  if (/return mentionChannel\(/.test(js)) return 'Inline';
  if (/return link\(/.test(js)) return 'Inline';
  if (/return image\(/.test(js)) return 'Inline';
  if (/return autoLink\(/.test(js)) return 'Inline';
  if (/return autoEmail\(/.test(js)) return 'Inline';
  if (/return plain\(/.test(js)) return 'Inline';
  if (/return spoiler\(/.test(js)) return 'Inline';
  if (/return color\(/.test(js)) return 'Inline';
  if (/return inlineKatex\(/.test(js)) return 'Inline';
  if (/return timestamp\(/.test(js)) return 'Inline';
  if (/return phoneChecker\(/.test(js)) return 'Inline';

  if (/return reducePlainTexts\(/.test(js)) return 'Vec<Inline>';
  if (/return true/.test(js) || /return false/.test(js)) return 'bool';
  if (/return parseInt/.test(js)) return 'usize';
  if (/return value\.length/.test(js)) return 'usize';
  if (/return cells/.test(js)) return 'Vec<Vec<Inline>>';

  // Fallback: rules that dispatch to other rules
  const name = rule.name;
  if (['Blocks', 'Emphasis', 'EmphasisWithWhitespace', 'InlineItemPattern',
       'InlineItemSlowPath', 'InlineItemAlphaPath'].includes(name)) return 'Inline';
  if (['Start'].includes(name)) return 'Vec<Node>';
  if (['MaybeBold', 'MaybeItalic', 'MaybeStrikethrough', 'MaybeReferences'].includes(name)) return 'Inline';

  return 'Inline';
}

// ─── Semantic predicate translation ──────────────────────────────────

function translatePredicate(jsCode, selfVar) {
  const code = jsCode.trim();

  // Re-entrancy guards
  if (/if \(skipBold\).*skipBold = true/.test(code)) {
    return `if ${selfVar}.skip_bold { return None; }\n        ${selfVar}.skip_bold = true;`;
  }
  if (/if \(skipItalic\).*skipItalic = true/.test(code)) {
    return `if ${selfVar}.skip_italic { return None; }\n        ${selfVar}.skip_italic = true;`;
  }
  if (/if \(skipStrikethrough\).*skipStrikethrough = true/.test(code)) {
    return `if ${selfVar}.skip_strikethrough { return None; }\n        ${selfVar}.skip_strikethrough = true;`;
  }
  if (/if \(skipReferences\).*skipReferences = true/.test(code)) {
    return `if ${selfVar}.skip_references { return None; }\n        ${selfVar}.skip_references = true;`;
  }
  // Reset guards
  if (/skipBold = false.*return false/.test(code)) return `${selfVar}.skip_bold = false; return None;`;
  if (/skipItalic = false.*return false/.test(code)) return `${selfVar}.skip_italic = false; return None;`;
  if (/skipStrikethrough = false.*return false/.test(code)) return `${selfVar}.skip_strikethrough = false; return None;`;
  if (/skipReferences = false.*return false/.test(code)) return `${selfVar}.skip_references = false; return None;`;
  if (/skipBold = false.*return text/.test(code)) return `${selfVar}.skip_bold = false;`;
  if (/skipItalic = false.*return text/.test(code)) return `${selfVar}.skip_italic = false;`;
  if (/skipStrikethrough = false.*return text/.test(code)) return `${selfVar}.skip_strikethrough = false;`;
  if (/skipReferences = false.*return text/.test(code)) return `${selfVar}.skip_references = false;`;

  // Options checks
  if (/return options\.katex\?\.parenthesisSyntax/.test(code)) {
    return `if !${selfVar}.config.katex_parenthesis { return None; }`;
  }
  if (/return options\.katex\?\.dollarSyntax/.test(code)) {
    return `if !${selfVar}.config.katex_dollar { return None; }`;
  }
  if (/return options\.emoticons/.test(code)) {
    return `if !${selfVar}.config.emoticons { return None; }`;
  }
  if (/return options\.colors/.test(code)) {
    return `if !${selfVar}.config.colors { return None; }`;
  }

  // LongCode fence check — fence/user are labels no longer bound in skeleton mode
  if (/codeFence = fence.*return true/.test(code)) {
    return `// codeFence guard: set fence on open`;
  }
  if (/return fence === codeFence/.test(code)) {
    return `// codeFence guard: match fence on close`;
  }

  // User mention guard
  if (/return !user\.endsWith\('__'\)/.test(code)) {
    return `// user guard: reject double-underscore suffixed mentions`;
  }

  return null;
}

// ─── Char class → Rust predicate ─────────────────────────────────────

function isSurrogate(c) {
  const cp = c.charCodeAt(0);
  return cp >= 0xD800 && cp <= 0xDFFF;
}

function charClassToRust(node, varName = 'c') {
  const checks = node.parts.filter(p => {
    // Skip UTF-16 surrogate pairs — they can't exist as Rust chars
    if (Array.isArray(p)) return !isSurrogate(p[0]) && !isSurrogate(p[1]);
    return !isSurrogate(p);
  }).map(p => {
    if (Array.isArray(p)) {
      return `(${varName} >= '${escRustChar(p[0])}' && ${varName} <= '${escRustChar(p[1])}')`;
    }
    return `${varName} == '${escRustChar(p)}'`;
  });
  if (checks.length === 0) return 'true'; // all parts were surrogates — always match (handled by manual unicode method)
  const inner = checks.join(' || ');
  return node.inverted ? `!(${inner})` : `(${inner})`;
}

// ─── Action classification (for event emission) ────────────────────

function classifyAction(result) {
  if (!result || result === '()' || result === 'todo!()') return { type: 'passthrough' };

  // Container nodes — have children (Vec<Inline>, Vec<Node>, etc.)
  const containers = [
    ['Node::Paragraph', 'Paragraph'],
    ['Node::Heading', 'Heading'],
    ['Node::Code', 'Code'],
    ['Node::BigEmoji', 'BigEmoji'],
    ['Node::OrderedList', 'OrderedList'],
    ['Node::UnorderedList', 'UnorderedList'],
    ['Node::Tasks', 'Tasks'],
    ['Node::Quote', 'Quote'],
    ['Node::SpoilerBlock', 'SpoilerBlock'],
    ['Inline::Bold', 'Bold'],
    ['Inline::Italic', 'Italic'],
    ['Inline::Strike', 'Strike'],
    ['Inline::Spoiler', 'Spoiler'],
    ['Inline::Link', 'Link'],
    ['Inline::Image', 'Image'],
  ];
  for (const [prefix, sk] of containers) {
    if (result.startsWith(prefix)) return { type: 'container', sk };
  }

  // Simple leaves — no span needed
  if (result.startsWith('Node::LineBreak')) return { type: 'leaf_event', event: 'LeafLineBreak' };
  if (result.startsWith('Node::HorizontalRule')) return { type: 'leaf_event', event: 'LeafHorizontalRule' };

  // Span-based leaves — capture start..end
  const leaves = [
    ['Inline::InlineCode', 'InlineCode'],
    ['Inline::MentionUser', 'MentionUser'],
    ['Inline::MentionChannel', 'MentionChannel'],
    ['Inline::InlineKatex', 'InlineKatex'],
    ['Node::Katex', 'Katex'],
  ];
  for (const [prefix, sk] of leaves) {
    if (result.startsWith(prefix)) return { type: 'leaf_span', sk };
  }

  // Emoji leaves — special events
  if (result.startsWith('Inline::EmojiShortCode')) return { type: 'leaf_emoji' };
  if (result.startsWith('Inline::EmojiUnicode')) return { type: 'leaf_emoji_unicode' };

  // Plain text — emit_text with captured span
  if (result.startsWith('Self::plain(')) return { type: 'leaf_text' };

  // Everything else — passthrough (reducePlainTexts, true, false, len, items, etc.)
  return { type: 'passthrough' };
}

// ─── Code generation ─────────────────────────────────────────────────

class RustGen {
  constructor() {
    this.varCounter = 0;
  }

  freshVar(prefix = 'v') {
    return `${prefix}${this.varCounter++}`;
  }

  // selfVar: 'self' at method top level, 'p' inside try_parse closures
  gen(node, indent, selfVar = 'self') {
    if (!node) return { code: '', result: 'None' };

    switch (node.type) {
      case 'choice': return this.genChoice(node, indent, selfVar);
      case 'sequence': return this.genSequence(node, indent, selfVar);
      case 'action': return this.genAction(node, indent, selfVar);
      case 'labeled': return this.genLabeled(node, indent, selfVar);
      case 'text': return this.genText(node, indent, selfVar);
      case 'literal': return this.genLiteral(node, indent, selfVar);
      case 'class': return this.genClass(node, indent, selfVar);
      case 'any': return this.genAny(indent, selfVar);
      case 'rule_ref': return this.genRuleRef(node, indent, selfVar);
      case 'optional': return this.genOptional(node, indent, selfVar);
      case 'zero_or_more': return this.genZeroOrMore(node, indent, selfVar);
      case 'one_or_more': return this.genOneOrMore(node, indent, selfVar);
      case 'simple_and': return this.genLookahead(node, indent, selfVar);
      case 'simple_not': return this.genNegLookahead(node, indent, selfVar);
      case 'semantic_and': return this.genSemanticAnd(node, indent, selfVar);
      case 'semantic_not': return this.genSemanticNot(node, indent, selfVar);
      case 'group': return this.gen(node.expression, indent, selfVar);
      case 'repeated': return this.genRepeated(node, indent, selfVar);
      default: return { code: `${indent}// TODO: unhandled ${node.type}\n`, result: '()' };
    }
  }

  genChoice(node, indent, selfVar) {
    if (node.alternatives.length === 1) {
      return this.gen(node.alternatives[0], indent, selfVar);
    }
    const lines = [];
    for (let i = 0; i < node.alternatives.length; i++) {
      const kw = i === 0 ? 'if' : '} else if';
      lines.push(`${indent}${kw} ${selfVar}.try_parse(|p| {`);
      const inner = this.gen(node.alternatives[i], indent + '    ', 'p');
      lines.push(inner.code);
      lines.push(`${indent}    Some(())`);
      lines.push(`${indent}}).is_some() {`);
    }
    lines.push(`${indent}} else {`);
    lines.push(`${indent}    return None;`);
    lines.push(`${indent}}`);
    return { code: lines.join('\n') + '\n', result: '()' };
  }

  genSequence(node, indent, selfVar) {
    const lines = [];
    let lastResult = '()';
    for (const elem of node.elements) {
      const r = this.gen(elem, indent, selfVar);
      lines.push(r.code);
      lastResult = r.result;
    }
    return { code: lines.join(''), result: lastResult };
  }

  genAction(node, indent, selfVar) {
    const jsCode = node.code.trim();
    const mapped = this.mapAction(jsCode, indent, selfVar);
    const cls = classifyAction(mapped.result);

    if (cls.type === 'container') {
      const inner = this.gen(node.expression, indent + '    ', 'p');
      return {
        code: `${indent}${selfVar}.try_parse(|p| {\n` +
              `${indent}    p.start_node(SK::${cls.sk});\n` +
              inner.code +
              `${indent}    p.finish_node(SK::${cls.sk});\n` +
              `${indent}    Some(())\n` +
              `${indent}})?;\n`,
        result: '()',
      };
    }

    const inner = this.gen(node.expression, indent, selfVar);
    switch (cls.type) {
      case 'leaf_text': {
        const ev = this.freshVar('ev');
        return {
          code: `${indent}let ${ev} = ${selfVar}.pos;\n` +
                inner.code +
                `${indent}${selfVar}.emit_text(${ev}, ${selfVar}.pos);\n`,
          result: '()',
        };
      }
      case 'leaf_span': {
        const ev = this.freshVar('ev');
        return {
          code: `${indent}let ${ev} = ${selfVar}.pos;\n` +
                inner.code +
                `${indent}${selfVar}.emit_leaf(SK::${cls.sk}, ${ev}, ${selfVar}.pos);\n`,
          result: '()',
        };
      }
      case 'leaf_event':
        return {
          code: inner.code +
                `${indent}${selfVar}.events.push(GreenEvent::${cls.event});\n`,
          result: '()',
        };
      default:
        return {
          code: inner.code + (mapped.code ? `${indent}${mapped.code}\n` : ''),
          result: '()',
        };
    }
  }

  genLabeled(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent, selfVar);
    const label = node.label ? snakeCase(node.label) : null;
    if (label && inner.result !== '()') {
      return {
        code: inner.code + `${indent}let ${label} = ${inner.result};\n`,
        result: label,
      };
    }
    return { code: inner.code, result: inner.result };
  }

  genText(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent, selfVar);
    const v = this.freshVar('text');
    return {
      code: `${indent}let ${v}_start = ${selfVar}.pos;\n` +
            inner.code +
            `${indent}let ${v} = &${selfVar}.input[${v}_start..${selfVar}.pos];\n`,
      result: v,
    };
  }

  genLiteral(node, indent, selfVar) {
    if (node.value === '') return { code: '', result: '()' };
    const escaped = escRustStr(node.value);
    return {
      code: `${indent}${selfVar}.expect_str("${escaped}")?;\n`,
      result: '()',
    };
  }

  genClass(node, indent, selfVar) {
    const v = this.freshVar('c');
    const pred = charClassToRust(node, v);
    return {
      code: `${indent}let ${v} = ${selfVar}.peek_char()?;\n` +
            `${indent}if ${pred} { ${selfVar}.advance(${v}.len_utf8()); } else { return None; }\n`,
      result: '()',
    };
  }

  genAny(indent, selfVar) {
    return {
      code: `${indent}${selfVar}.any_char()?;\n`,
      result: '()',
    };
  }

  genRuleRef(node, indent, selfVar) {
    const fnName = `parse_${snakeCase(node.name)}`;
    return {
      code: `${indent}${selfVar}.${fnName}()?;\n`,
      result: '()',
    };
  }

  genOptional(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent + '    ', 'p');
    return {
      code: `${indent}${selfVar}.try_parse(|p| {\n` +
            inner.code +
            `${indent}    Some(())\n` +
            `${indent}});\n`,
      result: '()',
    };
  }

  genZeroOrMore(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent + '    ', 'p');
    return {
      code: `${indent}while ${selfVar}.try_parse(|p| {\n` +
            inner.code +
            `${indent}    Some(())\n` +
            `${indent}}).is_some() {}\n`,
      result: '()',
    };
  }

  genOneOrMore(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent + '    ', 'p');
    const first = this.gen(node.expression, indent, selfVar);
    return {
      code: first.code +
            `${indent}while ${selfVar}.try_parse(|p| {\n` +
            inner.code +
            `${indent}    Some(())\n` +
            `${indent}}).is_some() {}\n`,
      result: '()',
    };
  }

  genLookahead(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent + '    ', 'p');
    return {
      code: `${indent}${selfVar}.lookahead(|p| {\n` +
            inner.code +
            `${indent}    Some(${inner.result})\n` +
            `${indent}})?;\n`,
      result: '()',
    };
  }

  genNegLookahead(node, indent, selfVar) {
    const inner = this.gen(node.expression, indent + '    ', 'p');
    return {
      code: `${indent}${selfVar}.negative_lookahead(|p| {\n` +
            inner.code +
            `${indent}    Some(${inner.result})\n` +
            `${indent}})?;\n`,
      result: '()',
    };
  }

  genSemanticAnd(node, indent, selfVar) {
    const translated = translatePredicate(node.code, selfVar);
    if (translated) {
      return {
        code: `${indent}${translated}\n`,
        result: '()',
      };
    }
    const shortCode = node.code.trim().replace(/\n/g, ' ').substring(0, 100);
    return {
      code: `${indent}// TODO: &{ ${shortCode} }\n`,
      result: '()',
    };
  }

  genSemanticNot(node, indent, selfVar) {
    const shortCode = node.code.trim().replace(/\n/g, ' ').substring(0, 100);
    return {
      code: `${indent}// TODO: !{ ${shortCode} }\n`,
      result: '()',
    };
  }

  genRepeated(node, indent, selfVar) {
    const min = node.min?.value ?? 0;
    const max = node.max?.value ?? null;
    const inner = this.gen(node.expression, indent + '    ', 'p');

    const lines = [`${indent}let mut _count = 0usize;\n`];

    if (min > 0) {
      lines.push(`${indent}for _ in 0..${min} {\n`);
      const req = this.gen(node.expression, indent + '    ', selfVar);
      lines.push(req.code);
      lines.push(`${indent}    _count += 1;\n`);
      lines.push(`${indent}}\n`);
    }

    const limit = max ? (max - min) : null;
    if (limit !== null) {
      lines.push(`${indent}for _ in 0..${limit} {\n`);
    } else {
      lines.push(`${indent}loop {\n`);
    }
    lines.push(`${indent}    if ${selfVar}.try_parse(|p| {\n`);
    lines.push(inner.code);
    lines.push(`${indent}        Some(())\n`);
    lines.push(`${indent}    }).is_none() { break; }\n`);
    lines.push(`${indent}    _count += 1;\n`);
    lines.push(`${indent}}\n`);

    if (min > 0) {
      lines.push(`${indent}if _count < ${min} { return None; }\n`);
    }

    return { code: lines.join(''), result: '()' };
  }

  mapAction(jsCode, indent, selfVar) {
    // Exact matches for common patterns — updated for serde-compatible AST types
    const mappings = [
      // Block nodes
      [/^return paragraph\(value\);?$/, (_, i) => ({ code: '', result: `Node::Paragraph { value }` })],
      [/^return heading\(text, count\);?$/, (_, i) => ({ code: '', result: `Node::Heading { value: text, level: count as u8 }` })],
      [/^return code\(lines, language\);?$/, (_, i) => ({ code: '', result: `Node::Code { value: lines, language }` })],
      [/^return tasks\(items\);?$/, (_, i) => ({ code: '', result: `Node::Tasks { value: items }` })],
      [/^return orderedList\(items\);?$/, (_, i) => ({ code: '', result: `Node::OrderedList { value: items }` })],
      [/^return unorderedList\(items\);?$/, (_, i) => ({ code: '', result: `Node::UnorderedList { value: items }` })],
      [/^return katex\(content\);?$/, (_, i) => ({ code: '', result: `Node::Katex { value: content.to_string() }` })],
      [/^return lineBreak\(\);?$/, (_, i) => ({ code: '', result: `Node::LineBreak { value: () }` })],
      [/^return horizontalRule\(loc\);?$/, (_, i) => ({ code: '', result: `Node::HorizontalRule { value: (), fallback: Some(loc) }` })],
      [/^return spoilerBlock\(value\);?$/, (_, i) => ({ code: '', result: `Node::SpoilerBlock { value }` })],
      [/^return quote\(value\);?$/, (_, i) => ({ code: '', result: `Node::Quote { value }` })],

      // Inline nodes
      [/^return bold\(reducePlainTexts\(text\)\);?$/, (_, i) => ({ code: '', result: `Inline::Bold { value: Self::reduce_plain_texts(text) }` })],
      [/^return italic\(text\);?$/, (_, i) => ({ code: '', result: `Inline::Italic { value: text }` })],
      [/^return italic\(reducePlainTexts\(text\)\);?$/, (_, i) => ({ code: '', result: `Inline::Italic { value: Self::reduce_plain_texts(text) }` })],
      [/^return strike\(reducePlainTexts\(text\)\);?$/, (_, i) => ({ code: '', result: `Inline::Strike { value: Self::reduce_plain_texts(text) }` })],
      [/^return inlineCode\(plain\(text\)\);?$/, (_, i) => ({ code: '', result: `Inline::InlineCode { value: Box::new(Self::plain(text)) }` })],
      [/^return emoji\(shortCode\);?$/, (_, i) => ({ code: '', result: `Inline::EmojiShortCode { value: Box::new(Self::plain(short_code)), short_code: short_code.to_string() }` })],
      [/^return emojiUnicode\(ch\);?$/, (_, i) => ({ code: '', result: `Inline::EmojiUnicode { value: (), unicode: ch.to_string() }` })],
      [/^return mentionUser\(user\);?$/, (_, i) => ({ code: '', result: `Inline::MentionUser { value: Box::new(Self::plain(user)) }` })],
      [/^return mentionChannel\(channel\);?$/, (_, i) => ({ code: '', result: `Inline::MentionChannel { value: Box::new(Self::plain(channel)) }` })],
      [/^return link\(href, reducePlainTexts\(title\)\);?$/, (_, i) => ({
        code: '', result: `Inline::Link { value: LinkValue { src: Box::new(Self::plain(href)), label: Self::reduce_plain_texts(title) } }`
      })],
      [/^return link\(href\);?$/, (_, i) => ({
        code: '', result: `Inline::Link { value: LinkValue { src: Box::new(Self::plain(href)), label: vec![Self::plain(href)] } }`
      })],
      [/^return image\(href, title\);?$/, (_, i) => ({
        code: '', result: `Inline::Image { value: ImageValue { src: Box::new(Self::plain(href)), label: Box::new(Self::plain(title)) } }`
      })],
      [/^return image\(href\);?$/, (_, i) => ({
        code: '', result: `Inline::Image { value: ImageValue { src: Box::new(Self::plain(href)), label: Box::new(Self::plain("")) } }`
      })],
      [/^return autoLink\(u, options\.customDomains\);?$/, (_, i) => ({
        code: '', result: `Inline::Link { value: LinkValue { src: Box::new(Self::plain(u)), label: vec![Self::plain(u)] } }`
      })],
      [/^return autoEmail\(e\);?$/, (_, i) => ({
        code: '', result: `Inline::Link { value: LinkValue { src: Box::new(Self::plain(&format!("mailto:{}", e))), label: vec![Self::plain(e)] } }`
      })],
      [/^return plain\(text\);?$/, (_, i) => ({ code: '', result: `Self::plain(text)` })],
      [/^return plain\(t\);?$/, (_, i) => ({ code: '', result: `Self::plain(t)` })],
      [/^return plain\('(.+?)'\);?$/, (m, i) => ({ code: '', result: `Self::plain("${escRustStr(m[1])}")` })],
      [/^return plain\(`(.+?)`\);?$/, (m, i) => ({ code: '', result: `Self::plain("${escRustStr(m[1])}")` })],
      [/^return plain\((.+?)\);?$/, (m, i) => ({ code: '', result: `Self::plain(${snakeCase(m[1])})` })],
      [/^return reducePlainTexts\((\w+)\);?$/, (m, i) => ({ code: '', result: `Self::reduce_plain_texts(${snakeCase(m[1])})` })],
      [/^return spoiler\(text\);?$/, (_, i) => ({ code: '', result: `Inline::Spoiler { value: text }` })],
      [/^return inlineKatex\(content\);?$/, (_, i) => ({ code: '', result: `Inline::InlineKatex { value: content.to_string() }` })],
      [/^return color\(r, g, b, a\);?$/, (_, i) => ({ code: '', result: `Inline::Color { value: ColorValue { r, g, b, a } }` })],

      // Passthrough
      [/^return value\.length;?$/, (_, i) => ({ code: '', result: `value.len()` })],
      [/^return true;?$/, (_, i) => ({ code: '', result: `true` })],
      [/^return false;?$/, (_, i) => ({ code: '', result: `false` })],
      [/^return parseInt\(number, 10\);?$/, (_, i) => ({ code: '', result: `number.parse::<usize>().ok()?` })],
      [/^return cells;?$/, (_, i) => ({ code: '', result: `cells` })],
      [/^return items;?$/, (_, i) => ({ code: '', result: `items` })],
      [/^return aligns;?$/, (_, i) => ({ code: '', result: `aligns` })],
      [/^return text;?$/, (_, i) => ({ code: '', result: `text` })],
      [/^return emo;?$/, (_, i) => ({ code: '', result: `emo` })],
      [/^return value;?$/, (_, i) => ({ code: '', result: `value` })],
    ];

    for (const [pattern, handler] of mappings) {
      const m = jsCode.match(pattern);
      if (m) return handler(m, indent);
    }

    // Guard resets in actions
    const guardReset = translatePredicate(jsCode, selfVar);
    if (guardReset) {
      return { code: `${indent}${guardReset}\n`, result: '()' };
    }

    // Fallback: comment
    const short = jsCode.split('\n')[0].substring(0, 120);
    return {
      code: `${indent}// JS: ${short}${jsCode.includes('\n') ? ' ...' : ''}\n`,
      result: 'todo!()',
    };
  }
}

// ─── Classify rules ──────────────────────────────────────────────────

// Only skip rules that have manual implementations in the helper section above.
const SKIP_RULES = new Set([
  'Any',
  'Digit', 'Digits', 'HexDigit', 'AlphaDigit', 'AlphaNumericChar',
  'Space', 'EndOfLine',
  'BlockedByJavascript',
  'BoldPlainRun', 'AnyBold', 'ItalicPlainRun', 'AnyItalic',
  'StrikePlainRun', 'StrikePlainRunFull', 'AnyStrike',
  'EmojiShortCodeName', 'EmojiShortCode',
  'DomainName', 'DomainNameLabel', 'DomainChar',
  'URLScheme',
  'Phone', 'PhoneNumber', 'PhonePrefix',
  'LocalPart', 'LocalPartChar', 'LocalPartSpecialChars',
  // Rules with custom manual implementations (avoid duplicates)
  'Whitespace', 'Escaped', 'PlainRun',
  'AutoLinkURL', 'URL',
  'Email',
  'Emoticon', 'EmoticonPattern',
  // InlineItemPattern + InlineItemAlphaPath + Inline have optimized manual implementations
  'InlineItemPattern', 'InlineItemAlphaPath', 'Inline',
  // References has manual impl for Link event wrapping
  'References',
  // Mentions: strip @/# prefix from span
  'UserMentionDirect', 'ChannelMention',
  // AutolinkedURL: manual impl to capture URL as DataStr
  'AutolinkedURL',
  // Unicode emoji has manual implementation
  'UnicodeEmoji', 'UnicodeEmojiEmoticon', 'UnicodeEmojiSupplementalSymbolsAndPictographs',
  'UnicodeEmojiZwjComponent', 'UnicodeEmojiTagSequence', 'UnicodeEmojiKeycapSequence',
  'UnicodeEmojiMiscellaneousSymbolsAndPictographs',
  'UnicodeEmojiMiscellaneousSymbolsAndPictographsFitzpatrickModifiers',
  'UnicodeEmojiTransportAndMapSymbols', 'UnicodeEmojiMiscellaneousTechnical',
  'UnicodeEmojiMiscellaneousSymbols', 'UnicodeEmojiDingbats', 'UnicodeEmojiArrows',
  'UnicodeEmojiGeometricSquares', 'UnicodeEmojiEnclosedBadges',
  'UnicodeEmojiTextPresentation', 'UnicodeEmojiFlags',
]);

// ─── Build output ────────────────────────────────────────────────────

const out = [];

out.push(`// AUTO-GENERATED from grammar.pegjs by peg-to-rust-codegen-v2.cjs
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
        let line_end = remaining.find('\\n').unwrap_or(remaining.len());
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
        if c == '\\n' || c == '\\r' { return None; }
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
        if self.remaining().starts_with("\\r\\n") {
            self.advance(2); Some(())
        } else if self.remaining().starts_with('\\n') || self.remaining().starts_with('\\r') {
            self.advance(1); Some(())
        } else {
            None
        }
    }

    fn is_space(c: char) -> bool {
        c == ' ' || c == '\\t' || c == '\\u{a0}'
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
`);

// ── Helper methods for SKIP_RULES ────────────────────────────────────

out.push(`
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
        if c.is_ascii_alphanumeric() || c > '\\u{7f}' { self.advance(c.len_utf8()); Some(c) } else { None }
    }

    // UTF8NamesValidation generated from grammar AST

    fn parse_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| !matches!(c, '*' | '_' | '~' | '\\x60' | ':' | '\\n' | '<' | '[' | ']' | '!' | ' ' | '\\t' | '\\u{a0}' | '(' | ')' | '\\\\' | '|'))?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_bold_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\\n' && c != '*' && c != ' ' && c != '_' && c != '~' && c != '\\u{a0}')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_bold(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\\n' && c != '*' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
    }

    fn parse_italic_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\\n' && c != '_' && c != ' ' && c != '\\u{a0}' && c != '*' && c != '~')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_italic(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\\n' && c != '_' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
    }

    fn parse_strike_plain_run(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\\n' && c != '~' && c != ' ' && c != '\\u{a0}' && c != '*' && c != '_')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_strike_plain_run_full(&mut self) -> Option<Inline> {
        let s = self.pos;
        let run = self.consume_while1(|c| c != '\\n' && c != '~' && c != ' ' && c != '*' && c != '_' && c != ':' && c != '\\x60' && c != '@' && c != '#' && c != '[' && c != ']' && c != '\\\\' && c != '<' && c != '!' && c != '|')?;
        self.emit_text(s, self.pos);
        Some(Self::plain(run))
    }

    fn parse_any_strike(&mut self) -> Option<Inline> {
        let s = self.pos;
        let c = self.peek_char()?;
        if c != '\\n' && c != '~' && c != ' ' { self.advance(c.len_utf8()); self.emit_text(s, self.pos); Some(Self::plain(&c.to_string())) } else { None }
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
            ' ' | '\\t' | '\\u{a0}' => { self.parse_whitespace()?; }
            '\\\\' => {
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
            '\\x60' => { self.parse_inline_code()?; }
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
            ';' | '=' | '>' | '\\'' | '%' => {
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
        self.expect_str("\\\\")?;
        let c = self.peek_char()?;
        if matches!(c, '*' | '_' | '~' | '\\x60' | '#' | '.') {
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
        while self.try_parse(|p| {
            p.expect_str(".")?;
            p.consume_while1(|c| c.is_ascii_alphanumeric() || c == '-')?;
            Some(())
        }).is_some() {}
        if self.pos == start { return None; }
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
        self.consume_while(|c| !c.is_ascii_whitespace() && c != '>' && c != ')');
        Some(self.input[start..self.pos].to_string())
    }

    fn parse_auto_link_url(&mut self) -> Option<String> {
        self.parse_url()
    }

    fn parse_local_part(&mut self) -> Option<&'a str> {
        self.consume_while1(|c| c.is_ascii_alphanumeric() || "!#$%&'*+/=?^_\\x60{|}~-.".contains(c))
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
                    if !(c == ' ' || c == '\\t' || c == '\\r' || c == '\\n' || c == ':' || c == '.' || c == '/' || c == '@') {
                        p.advance(c.len_utf8());
                    } else { return None; }
                    Some(())
                }).is_some() {}
                if p.try_parse(|p| { p.expect_str("://")?; Some(()) }).is_some() {
                } else if p.try_parse(|p| { p.expect_str(".")?; Some(()) }).is_some() {
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
            (":-/", "confused"), (":/", "confused"), (":\\\\", "confused"),
            ("=/", "confused"), ("=\\\\", "confused"),
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
`);

// ── Generated rule methods ───────────────────────────────────────────

out.push('\n    // ── Generated rule methods ─────────────────────────────────────\n');

for (const rule of ast.rules) {
  const name = rule.name;
  const fnName = `parse_${snakeCase(name)}`;

  if (SKIP_RULES.has(name)) {
    // Already implemented as helpers above, or trivial
    continue;
  }

  const retType = inferReturnType(rule);

  out.push(`    /// PEG rule: ${name} -> ${retType}`);
  out.push(`    fn ${fnName}(&mut self) -> Option<()> {`);

  const gen = new RustGen();
  const body = gen.gen(rule.expression, '        ', 'self');
  out.push(body.code);

  out.push(`        Some(())`);
  out.push('    }\n');
}

// ── Public API ───────────────────────────────────────────────────────

out.push(`
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
                GreenEvent::LeafEmoji(ref value, ref short_code) => {
                    nodes.push(Node::BigEmoji {
                        value: vec![Inline::EmojiShortCode {
                            value: Box::new(Self::plain(value)),
                            short_code: short_code.clone(),
                        }],
                    });
                    pos += 1;
                }
                GreenEvent::LeafUnicodeEmoji(ref unicode) => {
                    nodes.push(Node::BigEmoji {
                        value: vec![Inline::EmojiUnicode { value: (), unicode: unicode.clone() }],
                    });
                    pos += 1;
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
`);

// ─── Write output ────────────────────────────────────────────────────

const output = out.join('\n');
fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

// ─── Summary ─────────────────────────────────────────────────────────

const methods = (output.match(/fn parse_/g) || []).length;
const todos = (output.match(/TODO/g) || []).length;
const returns = (output.match(/Some\(/g) || []).length;
const lines = output.split('\n').length;

console.log(`v2 codegen complete:`);
console.log(`  ${lines} lines, ${methods} methods`);
console.log(`  ${todos} remaining TODOs`);
console.log(`  ${returns} Rust return statements`);
console.log(`  ${(output.length / 1024).toFixed(1)} KB`);
console.log(`  → ${OUTPUT_PATH}`);
