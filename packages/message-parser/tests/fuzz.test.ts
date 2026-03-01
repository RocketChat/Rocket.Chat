import * as fc from 'fast-check';
import { parse } from '../src';

describe('Message Parser Property-Based Fuzz Testing', () => {
    it('should return a valid array of ASTNodes for any arbitrary string', () => {
        fc.assert(
            fc.property(fc.string({ maxLength: 500 }), (text) => {
                try {
                    const ast = parse(text);
                    expect(Array.isArray(ast)).toBe(true);
                    // For any payload, if it's an array, it should be an array of nodes containing a "type"
                    ast.forEach((val: unknown) => {
                        const node = val as Record<string, unknown>;
                        expect(node).toHaveProperty('type');
                        expect(typeof node.type).toBe('string');
                    });
                } catch (error) {
                    if (!(error instanceof Error && error.name === 'SyntaxError')) {
                        throw error;
                    }
                }
            }),
            { numRuns: 1000 } // Execute 1000 random string checks
        );
    });

    it('should guarantee structural integrity for deeply nested markdown', () => {
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
                            const node = val as Record<string, unknown>;
                            if (node.type === 'PARAGRAPH') {
                                expect(Array.isArray(node.value)).toBe(true);
                            }
                        });
                    } catch (e) {
                        if (!(e instanceof Error && e.name === 'SyntaxError')) {
                            throw e;
                        }
                    }
                }
            ),
            { numRuns: 1000 }
        );
    });
});
