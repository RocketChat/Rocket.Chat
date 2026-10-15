// XEP-0029 conforming-char: anything above #x20 except " & ' / : < > @, DEL, lone surrogates and the BOMs
// eslint-disable-next-line no-control-regex
const NODE = /^[^\x00-\x20"&'/:<>@\x7F\uD800-\uDFFF￾￿]+$/u;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const MAX_NODE_BYTES = 256;
const MAX_DOMAIN_BYTES = 255;

const utf8Length = (value: string): number => new TextEncoder().encode(value).length;

/** Whether `value` is a `node@domain` JID as XEP-0029 defines one, without a resource. */
export const isBareJid = (value: unknown): value is string => {
	if (typeof value !== 'string') {
		return false;
	}
	const at = value.indexOf('@');
	if (at === -1) {
		return false;
	}
	const node = value.slice(0, at);
	const domain = value.slice(at + 1);
	return (
		NODE.test(node) &&
		utf8Length(node) <= MAX_NODE_BYTES &&
		domain.length <= MAX_DOMAIN_BYTES &&
		domain.split('.').every((label) => DOMAIN_LABEL.test(label))
	);
};
