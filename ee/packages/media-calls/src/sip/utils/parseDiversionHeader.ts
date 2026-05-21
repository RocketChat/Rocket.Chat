export type ParsedDiversion = {
	extension: string;
	displayName?: string;
};

/**
 * Parses the value of a single SIP Diversion header field (RFC 5806).
 *
 * RFC 5806 mandates the name-addr form (angle brackets are always required):
 *   Alice <sip:1234@pbx.example.com>;reason=unconditional
 *   "Display Name" <sip:1234@pbx.example.com>;reason=unconditional
 *   <sip:1234@pbx.example.com>;reason=unconditional
 *
 * Returns the SIP URI user part as `extension` and the display name when present.
 * Returns null if the value cannot be parsed into a usable extension.
 */
export function parseDiversionHeader(raw: string): ParsedDiversion | null {
	if (!raw || typeof raw !== 'string') {
		return null;
	}

	const value = raw.trim();

	// name-addr: optional display name (quoted or unquoted) followed by angle-bracket URI
	// Group 1: quoted display name, Group 2: unquoted display name, Group 3: SIP URI
	const nameAddrMatch = value.match(/^(?:"([^"]*)"|([^<"]+?))?\s*<([^>]+)>/);
	if (!nameAddrMatch) {
		return null;
	}

	const rawDisplayName = nameAddrMatch[1] ?? nameAddrMatch[2];
	const displayName = rawDisplayName ? rawDisplayName.trim() || undefined : undefined;
	const sipUri = nameAddrMatch[3];

	// Extract the user part from sip:user@host or sips:user@host
	const uriMatch = sipUri.match(/^sips?:([^@;>\s]+)@/i);
	if (!uriMatch?.[1]) {
		return null;
	}

	return { extension: uriMatch[1], displayName };
}
