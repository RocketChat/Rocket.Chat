import { parseDiversionHeader } from './parseDiversionHeader';

// In order of preference.
const CALLEE_IDENTITY_HEADERS = ['p-asserted-identity', 'remote-party-id', 'x-mxone-endpoint'];

type HeaderSource = {
	has(name: string): boolean;
	get(name: string): string;
};

/**
 * Reads the display name that the remote party of an outgoing call advertised about itself on a SIP response.
 * Returns null if no known identity header carries a name.
 */
export function getCalleeNameFromResponse(res: HeaderSource): string | null {
	for (const header of CALLEE_IDENTITY_HEADERS) {
		if (!res.has(header)) {
			continue;
		}

		const displayName = parseDiversionHeader(res.get(header))?.displayName;
		if (displayName) {
			return displayName;
		}
	}

	return null;
}
