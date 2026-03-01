import * as fc from 'fast-check';
import { parse } from '../src/index';

describe('Message Parser Property-Based Fuzz Testing', () => {
    it('should return a valid array of ASTNodes for any arbitrary string', () => {
        let hasSuccessfulParse = false;
        fc.assert(
            fc.property(fc.string({ maxLength: 500 }), (text) => {
                try {
                    const ast = parse(text);
                    expect(Array.isArray(ast)).toBe(true);
                    // For any payload, if it's an array, it should be an array of nodes containing a "type"
                    ast.forEach((val: unknown) => {
                        expect(val).toMatchObject({ type: expect.any(String) });
                    });
                    hasSuccessfulParse = true;
                } catch (error) {
                    if (!(error instanceof Error && error.name === 'SyntaxError')) {
                        throw error;
                    }
                    // Intentionally ignore SyntaxError during fuzzing
                }
            }),
            { numRuns: 1000 } // Execute 1000 random string checks
        );
        expect(hasSuccessfulParse).toBe(true);
    });

    it('should guarantee structural integrity for deeply nested markdown', () => {
        let hasSuccessfulParse = false;
        // Valid sequences that generate various inline tokens
        const sequences = ['*', '_', '~', '`', '# ', '## ', '> ', 'http://', 'https://', ' [', '](', ':', '!)', '\n'];

        fc.assert(
            fc.property(
                fc.array(
                    fc.tuple(
                        fc.constantFrom(...sequences),
                        fc.string({ maxLength: 20 })
                    ),
                    { maxLength: 50 }
                ),
                (tokens) => {
                    const text = tokens.map(([token, str]) => `${token}${str}`).join('');
                    try {
                        const ast = parse(text);

                        // Verify that any Paragraph node contains valid Elements
                        ast.forEach((val: unknown) => {
                            if (typeof val === 'object' && val !== null && 'type' in val && val.type === 'PARAGRAPH') {
                                expect(val).toMatchObject({ value: expect.any(Array) });
                            }
                        });
                        hasSuccessfulParse = true;
                    } catch (e) {
                        if (!(e instanceof Error && e.name === 'SyntaxError')) {
                            throw e;
                        }
                        // Intentionally ignore SyntaxError during fuzzing
                    }
                }
            ),
            { numRuns: 1000 }
        );
        expect(hasSuccessfulParse).toBe(true);
    });
});

