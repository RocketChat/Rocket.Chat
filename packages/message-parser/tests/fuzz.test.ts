import fc from 'fast-check';
import { parse } from '../src';

// Helper: Distinguishes between expected syntax errors and unexpected crashes
const isSafeError = (error: unknown): boolean => {
    if (error instanceof Error && error.name === 'SyntaxError') {
        return true;
    }
    // Log real crashes so we can see them in CI
    console.error('Unexpected Crash Found:', error);
    return false;
};

describe('Fuzz Testing (Property-Based)', () => {
    it('should not throw runtime exceptions on random string input', () => {
        fc.assert(
            fc.property(fc.string(), (inputString: string) => {
                try {
                    parse(inputString);
                    return true;
                } catch (error) {
                    return isSafeError(error);
                }
            }),
            { verbose: true }
        );
    });

    it('should handle nested markdown characters without hanging', () => {
        const markdownChars = fc.stringOf(
            fc.constantFrom('*', '_', '~', '`', '[', ']', '(', ')', '@', '#', ' ', 'a')
        );

        fc.assert(
            fc.property(markdownChars, (soup: string) => {
                try {
                    parse(soup);
                    return true;
                } catch (error) {
                    return isSafeError(error);
                }
            })
        );
    });
});