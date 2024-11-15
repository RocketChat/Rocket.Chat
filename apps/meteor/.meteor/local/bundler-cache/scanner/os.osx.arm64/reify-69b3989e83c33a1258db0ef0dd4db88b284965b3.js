module.export({prepareText:()=>prepareText});let font;module.link('./font.js',{font(v){font=v}},0);
const getWidth = (num) => `${~~num}`.length;
const whiteSpacePerChar = ' '.repeat(font.width);
function prepareText(arg) {
    const numberWidth = arg == null
        ? -1
        : typeof arg.maxNumber === 'number'
            ? getWidth(arg.maxNumber)
            : arg.maxWidth;
    const charWidth = numberWidth * font.width;
    const emptyLine = ' '.repeat(charWidth);
    const prepareWhitespace = (width) => {
        if (width > numberWidth)
            throw new Error("Too wide text");
        return whiteSpacePerChar.repeat(numberWidth - width);
    };
    function print(num, fill = ' ') {
        num = num == null ? undefined : ~~num;
        const numAsString = num == null
            ? fill === 0
                ? numberWidth === -1
                    ? undefined
                    : Array(numberWidth).fill('0').join('')
                : `${num}`
            : fill === 0
                ? Array(numberWidth - getWidth(num)).fill('0').join('')
                    + num
                : `${num}`;
        const whitespace = numberWidth === -1
            ? ''
            : prepareWhitespace(numAsString == null
                ? 0
                : numAsString.length);
        if (numAsString == null)
            return Array(font.height).fill(whitespace);
        const charLines = numAsString
            .split('')
            .map(char => font.number[Number(char)]);
        // Transpose line-by-line number-by-number
        const lines = Array.from({ length: font.height }, (_, i) => i)
            .map((lineNo) => whitespace +
            charLines
                .map(char => char.filter((_, i) => i === lineNo))
                .join(''));
        return lines;
    }
    function printAsPrefix(num, mainLines, opts = {}) {
        const { fill, separator = '' } = opts;
        const col1 = print(num, fill);
        const maxHeight = Math.max(col1.length, mainLines.length);
        return Array.from({ length: maxHeight }).map((_, line) => {
            const prefix = col1.length <= line
                ? emptyLine
                : col1[line];
            const main = mainLines.length <= line
                ? ''
                : mainLines[line];
            return prefix + separator + main;
        });
    }
    return {
        numberWidth,
        charWidth,
        emptyLine,
        print,
        printAsPrefix,
    };
}
