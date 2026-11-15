import { getPageMeta } from './getPageMeta';
import { MESSAGE_MAX_PARSE_LENGTH_DEFAULT } from '../../lib/constants';

export const getMarkdownParserLimit = (): number => {
	const value = getPageMeta('rc-message-parser-max-length');

	const defaultValue = MESSAGE_MAX_PARSE_LENGTH_DEFAULT > 0 ? MESSAGE_MAX_PARSE_LENGTH_DEFAULT : Infinity;
	if (value === null) return defaultValue;

	const parsed = Number(value);

	if (!Number.isInteger(parsed)) {
		return defaultValue;
	}

	return parsed > 0 ? parsed : Infinity;
};
