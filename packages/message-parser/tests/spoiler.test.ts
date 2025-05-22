import { parse } from '../src';
import { SpoilerNode, Paragraph, PlainText, Italic, Bold } from '../src/definitions';

describe('Spoiler Tag', () => {
  it('should parse a basic spoiler tag', () => {
    const message = '||spoiler text||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler text');
  });

  it('should parse an empty spoiler tag', () => {
    const message = '||||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('');
  });

  it('should parse a spoiler tag with leading/trailing spaces', () => {
    const message = '|| spoiler with spaces ||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe(' spoiler with spaces ');
  });

  it('should parse a spoiler tag with markdown-like characters inside (treated as plain text)', () => {
    const message = '||spoiler with *bold* and _italic_||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler with *bold* and _italic_');
  });

  it('should parse a spoiler at the beginning of a message', () => {
    const message = '||spoiler|| then text';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    const plainTextNode = paragraphNode.value[1] as PlainText;

    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler');
    expect(plainTextNode.type).toBe('PLAIN_TEXT');
    expect(plainTextNode.value).toBe(' then text');
  });

  it('should parse a spoiler in the middle of a message', () => {
    const message = 'text ||spoiler|| more text';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const plainTextNode1 = paragraphNode.value[0] as PlainText;
    const spoilerNode = paragraphNode.value[1] as SpoilerNode;
    const plainTextNode2 = paragraphNode.value[2] as PlainText;

    expect(plainTextNode1.type).toBe('PLAIN_TEXT');
    expect(plainTextNode1.value).toBe('text ');
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler');
    expect(plainTextNode2.type).toBe('PLAIN_TEXT');
    expect(plainTextNode2.value).toBe(' more text');
  });

  it('should parse a spoiler at the end of a message', () => {
    const message = 'text ||spoiler||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const plainTextNode = paragraphNode.value[0] as PlainText;
    const spoilerNode = paragraphNode.value[1] as SpoilerNode;

    expect(plainTextNode.type).toBe('PLAIN_TEXT');
    expect(plainTextNode.value).toBe('text ');
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler');
  });

  it('should parse multiple spoilers in one message', () => {
    const message = '||first|| then ||second||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode1 = paragraphNode.value[0] as SpoilerNode;
    const plainTextNode = paragraphNode.value[1] as PlainText;
    const spoilerNode2 = paragraphNode.value[2] as SpoilerNode;

    expect(spoilerNode1.type).toBe('SPOILER');
    expect(spoilerNode1.value).toBe('first');
    expect(plainTextNode.type).toBe('PLAIN_TEXT');
    expect(plainTextNode.value).toBe(' then ');
    expect(spoilerNode2.type).toBe('SPOILER');
    expect(spoilerNode2.value).toBe('second');
  });

  it('should parse spoiler next to other markdown', () => {
    const message = '*italic* ||spoiler|| **bold**';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const italicNode = paragraphNode.value[0] as Italic;
    const plainTextNode1 = paragraphNode.value[1] as PlainText; // Space between italic and spoiler
    const spoilerNode = paragraphNode.value[2] as SpoilerNode;
    const plainTextNode2 = paragraphNode.value[3] as PlainText; // Space between spoiler and bold
    const boldNode = paragraphNode.value[4] as Bold;

    expect(italicNode.type).toBe('ITALIC');
    // Italic node value is an array of PlainText
    expect((italicNode.value[0] as PlainText).value).toBe('italic');
    expect(plainTextNode1.type).toBe('PLAIN_TEXT');
    expect(plainTextNode1.value).toBe(' ');
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('spoiler');
    expect(plainTextNode2.type).toBe('PLAIN_TEXT');
    expect(plainTextNode2.value).toBe(' ');
    expect(boldNode.type).toBe('BOLD');
    // Bold node value is an array of PlainText
    expect((boldNode.value[0] as PlainText).value).toBe('bold');
  });

  it('should not parse an unclosed spoiler tag as spoiler (parses as plain text)', () => {
    const message = '||spoiler text';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const plainTextNode = paragraphNode.value[0] as PlainText;

    expect(plainTextNode.type).toBe('PLAIN_TEXT');
    expect(plainTextNode.value).toBe('||spoiler text');
  });
  
  it('should parse spoiler with complex content as plain text inside', () => {
    const message = '||`code` and [link](url)||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('`code` and [link](url)');
  });

  it('should handle spoilers with only symbols', () => {
    const message = '||!@#$%^&*()||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode = paragraphNode.value[0] as SpoilerNode;
    expect(spoilerNode.type).toBe('SPOILER');
    expect(spoilerNode.value).toBe('!@#$%^&*()');
  });

  it('should handle consecutive spoilers without spaces', () => {
    const message = '||first||||second||';
    const ast = parse(message);
    const paragraphNode = ast[0] as Paragraph;
    const spoilerNode1 = paragraphNode.value[0] as SpoilerNode;
    const spoilerNode2 = paragraphNode.value[1] as SpoilerNode;

    expect(spoilerNode1.type).toBe('SPOILER');
    expect(spoilerNode1.value).toBe('first');
    expect(spoilerNode2.type).toBe('SPOILER');
    expect(spoilerNode2.value).toBe('second');
  });
});
