export type ParsedDiversion = {
	extension: string;
	displayName?: string;
};

/**
 * Parses the value of a single SIP Diversion header field (RFC 5806).
 *
 * Handles both name-addr forms:
 *   "Display Name" <sip:1234@pbx.example.com>;reason=unconditional
 *   <sip:1234@pbx.example.com>;reason=unconditional
 *
 * And the addr-spec form:
 *   sip:1234@pbx.example.com;reason=unconditional
 *
 * Returns the SIP URI user part as `extension` and the display name when present.
 * Returns null if the value cannot be parsed into a usable extension.
 */
export function parseDiversionHeader(raw: string): ParsedDiversion | null {
	if (!raw || typeof raw !== 'string') {
		return null;
	}

	const value = raw.trim();

	let sipUri: string;
	let displayName: string | undefined;

	// name-addr: optionally quoted display name followed by angle-bracket URI
	const nameAddrMatch = value.match(/^(?:"([^"]*)")?\s*<([^>]+)>/);
	if (nameAddrMatch) {
		const rawDisplayName = nameAddrMatch[1];
		displayName = rawDisplayName ? rawDisplayName.trim() || undefined : undefined;
		sipUri = nameAddrMatch[2];
	} else {
		// addr-spec: bare sip URI, parameters follow a semicolon
		sipUri = value.split(';')[0].trim();
	}

	// Extract the user part from sip:user@host or sips:user@host
	const uriMatch = sipUri.match(/^sips?:([^@;>\s]+)@/i);
	if (!uriMatch?.[1]) {
		return null;
	}

	return { extension: uriMatch[1], displayName };
}
