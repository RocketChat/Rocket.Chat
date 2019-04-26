import { Match, check } from 'meteor/check';

export const objectMaybeIncluding = (types) => Match.Where((value) => {
	Object.keys(types).forEach((field) => {
		if (value[field] == null) {
			return;
		}

		try {
			check(value[field], types[field]);
		} catch (error) {
			error.path = field;
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
