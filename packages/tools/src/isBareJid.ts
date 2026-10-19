// XEP-0029 conforming-char: anything above #x20 except " & ' / : < > @, DEL, lone surrogates and the BOMs
// eslint-disable-next-line no-control-regex
const NODE = /^[^\x00-\x20"&'/:<>@\x7F\uD800-\uDFFF￾￿]+$/u;
const ASCII_LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
// The URL parser would read these as a port, path, query, userinfo or IP literal instead of part of the host, and drops trailing controls
const NOT_IN_HOST = /[\s\p{Cc}/\\?#@:%[\]]/u;
const MAX_NODE_BYTES = 256;
const MAX_DOMAIN_BYTES = 255;

const utf8Length = (value: string): number => new TextEncoder().encode(value).length;

/** The domain in the IDNA ASCII, lowercase spelling XMPP compares domains in. */
const toAsciiDomain = (domain: string): string | undefined => {
	if (!domain || domain.endsWith('.') || NOT_IN_HOST.test(domain)) {
		return undefined;
	}
	let ascii: string;
	try {
		ascii = new URL(`http://${domain}`).hostname;
	} catch {
		return undefined;
	}
	if (ascii.length > MAX_DOMAIN_BYTES || !ascii.split('.').every((label) => ASCII_LABEL.test(label))) {
		return undefined;
	}
	return ascii;
};

/** The `node@domain` JID `value` names, as XEP-0029 defines one, with its domain in the spelling XMPP compares; undefined for anything else. */
export const normalizeBareJid = (value: unknown): string | undefined => {
	if (typeof value !== 'string') {
		return undefined;
	}
	const at = value.indexOf('@');
	if (at === -1) {
		return undefined;
	}
	const node = value.slice(0, at);
	const domain = toAsciiDomain(value.slice(at + 1));
	if (!domain || !NODE.test(node) || utf8Length(node) > MAX_NODE_BYTES) {
		return undefined;
	}
	return `${node}@${domain}`;
};

/** Whether `value` is a `node@domain` JID as XEP-0029 defines one, without a resource. */
export const isBareJid = (value: unknown): value is string => normalizeBareJid(value) !== undefined;
