import { describe, it, expect } from 'vitest';
import { Base64 } from 'meteor/base64';

const asciiToArray = (str: string): Uint8Array => {
    const arr = Base64.newBinary(str.length);
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c > 0xFF) {
            throw new Error("Not ascii");
        }
        arr[i] = c;
    }
    return arr;
};

const arrayToAscii = (arr: Uint8Array | number[]): string => {
    const result: string[] = [];
    for (let i = 0; i < arr.length; i++) {
        result.push(String.fromCharCode(arr[i]));
    }
    return result.join('');
};

describe('Base64', () => {
    it('testing the test utilities', () => {
        expect(arrayToAscii(asciiToArray("The quick brown fox jumps over the lazy dog")))
            .toEqual("The quick brown fox jumps over the lazy dog");
    });

    it('empty inputs', () => {
        expect(Base64.encode(new Uint8Array(0))).toEqual("");
        expect(Base64.decode("")).toEqual(new Uint8Array(0));
    });

    it('wikipedia examples', () => {
        const tests = [
            { txt: "pleasure.", res: "cGxlYXN1cmUu" },
            { txt: "leasure.", res: "bGVhc3VyZS4=" },
            { txt: "easure.", res: "ZWFzdXJlLg==" },
            { txt: "asure.", res: "YXN1cmUu" },
            { txt: "sure.", res: "c3VyZS4=" }
        ];

        tests.forEach(t => {
            expect(Base64.encode(asciiToArray(t.txt))).toEqual(t.res);
            expect(arrayToAscii(Base64.decode(t.res))).toEqual(t.txt);
        });
    });

    it('non-text examples', () => {
        const tests = [
            { array: [0, 0, 0], b64: "AAAA" },
            { array: [0, 0, 1], b64: "AAAB" }
        ];

        tests.forEach(t => {
            expect(Base64.encode(t.array)).toEqual(t.b64);

            const expectedAsBinary = Base64.newBinary(t.array.length);
            t.array.forEach((val, i) => {
                expectedAsBinary[i] = val;
            });

            expect(Base64.decode(t.b64)).toEqual(expectedAsBinary);
        });
    });
});