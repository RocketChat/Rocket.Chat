import { detectSensitiveContent } from './detectSensitiveContent';

describe('detectSensitiveContent', () => {
  it('returns false for normal messages', () => {
    expect(detectSensitiveContent('Hello Rocket.Chat!')).toBe(false);
    expect(detectSensitiveContent('Can we meet tomorrow?')).toBe(false);
  });

  it('detects bearer tokens', () => {
    expect(detectSensitiveContent('Authorization: Bearer abc123')).toBe(true);
  });

  it('detects password assignments', () => {
    expect(detectSensitiveContent('password=my-secret')).toBe(true);
    expect(detectSensitiveContent('PASSWORD = secret')).toBe(true);
  });

  it('detects AWS access keys', () => {
    expect(detectSensitiveContent('AKIAIOSFODNN7EXAMPLE')).toBe(true);
  });

  it('detects private keys', () => {
    expect(
      detectSensitiveContent(`-----BEGIN PRIVATE KEY-----
ABCDEF
-----END PRIVATE KEY-----`),
    ).toBe(true);
  });

  it('detects sensitive content embedded in normal text', () => {
    expect(
      detectSensitiveContent('Here is my AWS key: AKIAIOSFODNN7EXAMPLE'),
    ).toBe(true);

    expect(
      detectSensitiveContent('Credentials: password=secret123'),
    ).toBe(true);

    expect(
      detectSensitiveContent(
        'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      ),
    ).toBe(true);
  });

  it('returns false for empty input', () => {
    expect(detectSensitiveContent('')).toBe(false);
  });
});