import { describe, it, expect } from 'vitest';
import { SHA256 } from 'meteor/sha';

describe('SHA256', () => {
    it('should correctly hash the example string provided in the legacy docs', () => {
        expect(SHA256('meteor')).toBe('647d177cca8601046a3cb39e12f55bec5790bfcbc42199dd5fcf063200fac1d0');
    });

    it('should hash empty strings correctly', () => {
        expect(SHA256('')).toMatchInlineSnapshot(`"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"`);
    });

    it('should handle special UTF-8 characters', () => {
        // Tests the utf8Encode logic ported from the original codebase
        const input = 'météør🚀';

        // Hash output should be deterministic based on UTF-8 bytes
        expect(SHA256(input)).toHaveLength(64);
        expect(SHA256(input)).toMatchInlineSnapshot(`"33c9e45086d64e35dfb5ae3a44b4dec819ca750cd35e1fd4d4f95e64b27437e2"`);
    });

    it('should produce consistent hashes for the same input', () => {
        expect(SHA256('consistent')).toBe(SHA256('consistent'));
    });

    it('should produce different hashes for different inputs', () => {
        expect(SHA256('input one')).not.toBe(SHA256('input two'));
    });

    it('should produce the correct hash for a known input', () => {
        expect(SHA256('hello world')).toMatchInlineSnapshot(`"b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"`);
    });

    it('should produce the correct hash for a known input with special characters', () => {
        expect(SHA256('P@$$w0rd!')).toMatchInlineSnapshot(`"21f2e429abd0404b46953a9bee5e5fceb279fdec40788263991744e5931aa6d7"`);
    });
});