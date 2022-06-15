// http://stackoverflow.com/a/14824756

const ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
const rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const rtlRegExp = new RegExp(`^[^${ltrChars}]*[${rtlChars}]`);

export const isRTL = (text: string): boolean => rtlRegExp.test(text);
