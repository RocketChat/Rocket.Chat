// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ParsedXmppUserId {
	/** node / localpart of the JID, e.g. `mychannel` */
	local: string;
	/** domain of the JID, e.g. `conference.xmpp.host` */
	domain: string;
	/** optional resource — usually the user's nick in a MUC, e.g. `prince` */
	resource?: string;
	/** canonical XMPP JID rebuilt as `local@domain[/resource]` */
	jid: string;
}

/**
 * Decode the `=xx` escapes of a Matrix localpart back to their characters.
 *
 * Characters outside the safe localpart set are encoded as `=` followed by the
 * lowercase hex of each UTF-8 byte (https://spec.matrix.org/latest/appendices/#mapping-from-other-character-sets),
 * e.g. `/` -> `=2f`, `@` -> `=40`. Multi-byte characters become several
 * consecutive `=xx` sequences, so we collect the raw bytes and decode them
 * together as UTF-8 rather than per-escape.
 *
 * @param value - escaped localpart, e.g. `prince=2fmychannel=40conference.xmpp.host`
 * @returns the decoded value, e.g. `prince/mychannel@conference.xmpp.host`
 */
export const decodeXmppUserId = (value: string): string => {
	const bytes: number[] = [];

	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		const hex = value.substring(i + 1, i + 3);

		if (char === '=' && /^[0-9a-fA-F]{2}$/.test(hex)) {
			bytes.push(parseInt(hex, 16));
			i += 2;
			continue;
		}

		bytes.push(...Buffer.from(char, 'utf8'));
	}

	return Buffer.from(bytes).toString('utf8');
};

/**
 * Whether a decoded value is a full XMPP MUC occupant id, i.e. it carries both a
 * `@` (separating local from domain) and a `/` (separating the resource). Use
 * this to guard {@link parseXmppUserId}, which assumes a domain separator is
 * present and otherwise rejects the input.
 *
 * @param decoded - already-decoded value, e.g. `prince/mychannel@conference.xmpp.host`
 */
export const isFullXmppUserId = (decoded: string): boolean => decoded.includes('@') && decoded.includes('/');

/**
 * Parse a decoded XMPP user identifier into its JID components. The input must
 * already be decoded (see {@link decodeXmppUserId}); the value carried in a
 * Matrix localpart is the part after the bridge prefix and before `:serverName`.
 *
 * matrix-bifrost packs an XMPP JID into the localpart as `<resource>/<local>@<domain>`
 * — resource first, since it's usually the more meaningful MUC nick. As neither
 * `local` nor `domain` may contain `/` or `@`, we parse from the right so a `/`
 * or `@` inside the resource is preserved.
 *
 * @param decoded - decoded user id, e.g. `prince/mychannel@conference.xmpp.host`
 * @throws if the value has no `@` separating local from domain, if `local` or
 * `domain` is empty, or if a resource separator (`/`) is present but the
 * resource is empty
 *
 * @example
 * parseXmppUserId('prince/mychannel@conference.xmpp.host');
 * // -> { local: 'mychannel', domain: 'conference.xmpp.host', resource: 'prince',
 * //      jid: 'mychannel@conference.xmpp.host/prince' }
 */
export const parseXmppUserId = (decoded: string): ParsedXmppUserId => {
	const atIndex = decoded.lastIndexOf('@');
	if (atIndex === -1) {
		throw new Error(`Invalid XMPP user id, missing domain separator: ${decoded}`);
	}

	const domain = decoded.substring(atIndex + 1);
	const beforeDomain = decoded.substring(0, atIndex);

	const slashIndex = beforeDomain.lastIndexOf('/');
	const resource = slashIndex === -1 ? undefined : beforeDomain.substring(0, slashIndex);
	const local = slashIndex === -1 ? beforeDomain : beforeDomain.substring(slashIndex + 1);

	if (!local || !domain) {
		throw new Error(`Invalid XMPP user id, empty local or domain: ${decoded}`);
	}

	// A `/` with nothing before it is a malformed resource, not a bare JID.
	if (slashIndex !== -1 && !resource) {
		throw new Error(`Invalid XMPP user id, empty resource: ${decoded}`);
	}

	return {
		local,
		domain,
		resource,
		jid: resource ? `${local}@${domain}/${resource}` : `${local}@${domain}`,
	};
};
