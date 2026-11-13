import { i18n } from '../../i18n';

const listFormatOptions: Intl.ListFormatOptions = { style: 'long', type: 'conjunction' };

const padSeparator = (separator: string): string =>
	`${/^\p{L}/u.test(separator) ? ' ' : ''}${separator}${/\s$/u.test(separator) ? '' : ' '}`;

export const formatMentionList = (usernames: string[], lng: string | undefined): string => {
	let listFormat: Intl.ListFormat;
	try {
		listFormat = new Intl.ListFormat(lng || i18n.language, listFormatOptions);
	} catch {
		listFormat = new Intl.ListFormat('en', listFormatOptions);
	}

	return listFormat
		.formatToParts(usernames.map((username) => `@${username}`))
		.map(({ type, value }) => (type === 'literal' ? padSeparator(value) : value))
		.join('');
};
