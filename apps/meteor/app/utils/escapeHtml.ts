const escapeMap: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#x27;',
	'`': '&#x60;',
};

const createEscaper = () => {
	const escaper = (match: string) => {
		return escapeMap[match];
	};

	const source = `(?:${Object.getOwnPropertyNames(escapeMap).join('|')})`;
	const testRegexp = RegExp(source);
	const replaceRegexp = RegExp(source, 'g');

	return (str: string) => {
		return testRegexp.test(str) ? str.replace(replaceRegexp, escaper) : str;
	};
};

export const escapeHtml = createEscaper();
