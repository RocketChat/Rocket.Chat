const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const BASE_64_VALS: Record<string, number> = Object.create(null);

const getChar = (val: number): string => BASE_64_CHARS.charAt(val);
const getVal = (ch: string): number => ch === '=' ? -1 : BASE_64_VALS[ch];

for (let i = 0; i < BASE_64_CHARS.length; i++) {
    BASE_64_VALS[getChar(i)] = i;
}

export const newBinary = (len: number): Uint8Array => {
    return new Uint8Array(len);
};

export const encode = (array: string | ArrayLike<number>): string => {
    let input: ArrayLike<number>;

    if (typeof array === "string") {
        const str = array;
        const tempArray = newBinary(str.length);
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            if (ch > 0xFF) {
                throw new Error("Not ascii. Base64.encode can only take ascii strings.");
            }
            tempArray[i] = ch;
        }
        input = tempArray;
    } else {
        input = array;
    }

    const answer: string[] = [];
    let a: number | null = null;
    let b: number | null = null;
    let c: number | null = null;
    let d: number | null = null;

    for (let i = 0; i < input.length; i++) {
        switch (i % 3) {
            case 0:
                a = (input[i] >> 2) & 0x3F;
                b = (input[i] & 0x03) << 4;
                break;
            case 1:
                b = b! | (input[i] >> 4) & 0xF;
                c = (input[i] & 0xF) << 2;
                break;
            case 2:
                c = c! | (input[i] >> 6) & 0x03;
                d = input[i] & 0x3F;
                answer.push(getChar(a!));
                answer.push(getChar(b!));
                answer.push(getChar(c!));
                answer.push(getChar(d!));
                a = null;
                b = null;
                c = null;
                d = null;
                break;
        }
    }

    if (a != null) {
        answer.push(getChar(a));
        answer.push(getChar(b!));
        if (c == null) {
            answer.push('=');
        } else {
            answer.push(getChar(c));
        }

        if (d == null) {
            answer.push('=');
        }
    }

    return answer.join("");
};

export const decode = (str: string): Uint8Array => {
    let len = Math.floor((str.length * 3) / 4);
    if (str.charAt(str.length - 1) === '=') {
        len--;
        if (str.charAt(str.length - 2) === '=') {
            len--;
        }
    }

    const arr = newBinary(len);

    let one: number | null = null;
    let two: number | null = null;
    let three: number | null = null;

    let j = 0;

    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i);
        const v = getVal(c);
        switch (i % 4) {
            case 0:
                if (v < 0) {
                    throw new Error('invalid base64 string');
                }
                one = v << 2;
                break;
            case 1:
                if (v < 0) {
                    throw new Error('invalid base64 string');
                }
                one = one! | (v >> 4);
                arr[j++] = one;
                two = (v & 0x0F) << 4;
                break;
            case 2:
                if (v >= 0) {
                    two = two! | (v >> 2);
                    arr[j++] = two;
                    three = (v & 0x03) << 6;
                }
                break;
            case 3:
                if (v >= 0) {
                    arr[j++] = three! | v;
                }
                break;
        }
    }

    return arr;
};