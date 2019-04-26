import { Match, check } from 'meteor/check';

const normalizeErrorMessage = (message) => {
	const start = Math.max(0, message.lastIndexOf('Match error:'));
	const end = message.indexOf(' in field');

	return message.substring(start + 13, end === -1 ? undefined : end);
};

export const objectMaybeIncluding = (types) => Match.Where((value) => {
	Object.keys(types).forEach((field) => {
		if (value[field] == null) {
			return;
		}

		try {
			check(value[field], types[field]);
		} catch (error) {
			let currentPath = '';

			if (error.path) {
				currentPath = error.path[0] === '[' ? error.path : `.${ error.path }`;
			}

			error.path = field + currentPath;
			error.message = normalizeErrorMessage(error.message);

			throw error;
		}
	});

	return true;
});

/**
 * IMPORTANT
 *
 * This validator prevents malicious href values
 * intending to run arbitrary js code in anchor tags.
 * You should use it whenever the value you're checking
 * is going to be rendered in the href attribute of a
 * link.
 */
export const ValidHref = Match.Where((value) => {
	check(value, String);

	if (/^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
});
