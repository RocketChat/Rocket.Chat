/* Ambient declarations for the CJS surface of `ltx` and `@xmpp/jid` that this package consumes. */

declare module 'ltx/lib/Element' {
	class Element {
		name: string;

		attrs: Record<string, string>;

		children: (Element | string)[];

		parent: Element | null;

		constructor(name: string, attrs?: Record<string, string>);

		is(name: string, xmlns?: string): boolean;

		getName(): string;

		getNS(): string | undefined;

		findNS(prefix: string | null): string | undefined;

		getAttr(name: string, xmlns?: string): string | undefined;

		getChild(name: string, xmlns?: string): Element | undefined;

		getChildren(name: string, xmlns?: string): Element[];

		getChildByAttr(attr: string, val: string, xmlns?: string, recursive?: boolean): Element | undefined;

		getChildElements(): Element[];

		getText(): string;

		getChildText(name: string, xmlns?: string): string | null;

		root(): Element;

		up(): Element;

		c(name: string, attrs?: Record<string, string>): Element;

		cnode(child: Element): Element;

		t(text: string): Element;

		remove(el: Element | string, xmlns?: string): Element;

		clone(): Element;

		attr(attr: string, val?: string): string | undefined;

		toString(): string;
	}

	export default Element;
}

declare module 'ltx/lib/parsers/ltx' {
	import { EventEmitter } from 'events';

	class SaxLtx extends EventEmitter {
		write(data: string | Buffer): void;

		end(data?: string | Buffer): void;

		on(event: 'startElement', listener: (name: string, attrs: Record<string, string>) => void): this;

		on(event: 'endElement', listener: (name: string) => void): this;

		on(event: 'text', listener: (str: string) => void): this;

		on(event: 'error', listener: (error: Error) => void): this;
	}

	export default SaxLtx;
}

declare module 'ltx' {
	import type Element from 'ltx/lib/Element';

	export { Element };
	export function parse(data: string): Element;
	export function escapeXML(text: string): string;
	export function unescapeXML(text: string): string;
	export function escapeXMLText(text: string): string;
	export function isElement(el: unknown): el is Element;
}

declare module '@xmpp/jid' {
	class JID {
		local: string;

		domain: string;

		resource: string;

		constructor(local: string | null | undefined, domain: string, resource?: string | null);

		bare(): JID;

		equals(other: JID): boolean;

		getLocal(unescape?: boolean): string;

		toString(unescape?: boolean): string;
	}

	function jid(address: string): JID;
	function jid(local: string | null | undefined, domain: string, resource?: string | null): JID;

	function parse(address: string): JID;
	function escapeLocal(local: string): string;
	function unescapeLocal(local: string): string;
	function detectEscape(local: string): boolean;

	export { JID, jid, parse, escapeLocal, unescapeLocal, detectEscape };
}
