import { MESSAGE_MAX_PARSE_LENGTH_DEFAULT } from './constants';

export function getMessageMaxParseLength(): number {
	const parsed = Number.parseInt(process.env.MESSAGE_MAX_PARSE_LENGTH ?? '', 10);
	return Number.isFinite(parsed) ? parsed : MESSAGE_MAX_PARSE_LENGTH_DEFAULT;
}
