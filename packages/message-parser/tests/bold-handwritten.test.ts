import { parseBold } from '../src/parser/bold';

describe('Handwritten Bold Parser', () => {
  it('should parse simple bold text', () => {
    const input = '*hello*';
    const [result, _pos] = parseBold(input, 0);
    
    expect(result).not.toBeNull();
    expect(result?.type).toBe('BOLD');
    expect(result?.value).toEqual([
      { type: 'PLAIN_TEXT', value: 'hello' }
    ]);
    expect(_pos).toBe(7);
  });

  it('should parse double asterisk bold text', () => {
    const input = '**hello**';
    const [result, _pos] = parseBold(input, 0);
    
    expect(result?.type).toBe('BOLD');
    expect(result?.value).toEqual([
      { type: 'PLAIN_TEXT', value: 'hello' }
    ]);
    expect(_pos).toBe(9);
  });

  it('should parse bold text with nested user mention', () => {
    const input = '*hello @Matheus*';
    const [result, _pos] = parseBold(input, 0);
    
    expect(result?.type).toBe('BOLD');
    expect(result?.value).toEqual([
      { type: 'PLAIN_TEXT', value: 'hello ' },
      { type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'Matheus' } }
    ]);
  });

  it('should backtrack and return null if closing delimiter is missing', () => {
    const input = '*hello';
    const [result, pos] = parseBold(input, 0);
    
    expect(result).toBeNull();
    expect(pos).toBe(0);
  });
});