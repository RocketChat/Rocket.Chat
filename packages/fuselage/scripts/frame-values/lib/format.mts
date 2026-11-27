import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { format } from 'oxfmt';

const { ignorePatterns: _, ...options } = JSON.parse(readFileSync(join(import.meta.dirname, '../../../../../.oxfmtrc.json'), 'utf8'));

/** Formats generated source the way `yarn format` formats the file it is written to. */
export const formatSource = async (file: string, source: string) => {
	const { code, errors } = await format(file, source, options);
	if (errors.length) {
		throw new Error(`${file}: ${errors.map(({ message }) => message).join('\n')}`);
	}
	return code;
};
