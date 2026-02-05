import fc from 'fast-check';
import { parse } from '../src';

describe('Fuzz Testing (Property-Based)', () => {
    // 1. The "Crash Test"
    it('should not throw runtime exceptions on random string input', () => {
        fc.assert(
            fc.property(fc.string(), (inputString: string) => {
                try {
                    parse(inputString); 
                    return true; // Success is good
                } catch (error: any) {
                    // CRITICAL FIX:
                    // If the parser just says "Invalid syntax", that is SAFE.
                    // We only fail if it's a real crash (like "TypeError").
                    if (error.name === 'SyntaxError') {
                        return true; 
                    }
                    
                    // If we get here, it was a BAD crash.
                    console.error('Real Crash Found:', error);
                    return false;
                }
            }),
            { verbose: true }
        );
    });

    // 2. The "Markdown Soup"
    it('should handle nested markdown characters without hanging', () => {
        const markdownChars = fc.stringOf(
            fc.constantFrom('*', '_', '~', '`', '[', ']', '(', ')', '@', '#', ' ', 'a')
        );

        fc.assert(
            fc.property(markdownChars, (soup: string) => {
                try {
                    parse(soup);
                    return true;
                } catch (error: any) {
                    if (error.name === 'SyntaxError') {
                        return true;
                    }
                    return false;
                }
            })
        );
    });
});