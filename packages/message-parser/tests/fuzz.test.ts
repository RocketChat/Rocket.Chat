import * as fc from 'fast-check';
import { parse } from '../src/index';

describe('Message Parser Property-Based Fuzz Testing', () => {
    it('should return a valid array of ASTNodes for any arbitrary string', () => {
        let successfulParses = 0;
        fc.assert(
            fc.property(fc.string({ maxLength: 500 }), (text) => {
                try {
                    const ast = parse(text);
                    expect(Array.isArray(ast)).toBe(true);
                    ast.forEach((val: unknown) => {
                        expect(val).toMatchObject({ type: expect.any(String) });
                    });
                    successfulParses++;
                } catch (error) {
                    if (!(error instanceof Error && error.name === 'SyntaxError')) {
                        throw error;
                    }
                }
            }),
            { numRuns: 1000 }
        );
        expect(successfulParses).toBeGreaterThan(0);
    });

    it('should guarantee structural integrity for deeply nested markdown', () => {
        let successfulParses = 0;
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

                        ast.forEach((val: unknown) => {
                            if (typeof val === 'object' && val !== null && 'type' in val && val.type === 'PARAGRAPH') {
                                expect(val).toMatchObject({ value: expect.any(Array) });
                            }
                        });
                        successfulParses++;
                    } catch (e) {
                        if (!(e instanceof Error && e.name === 'SyntaxError')) {
                            throw e;
                        }
                    }
                }
            ),
            { numRuns: 1000 }
        );
        expect(successfulParses).toBeGreaterThan(0);
    });
});
