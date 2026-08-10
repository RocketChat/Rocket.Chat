import { Emitter } from '@rocket.chat/emitter';
import Element from 'ltx/lib/Element';
import SaxLtx from 'ltx/lib/parsers/ltx';

export type StanzaParserEvents = {
	/** The `<stream:stream>` opening tag (attributes only, no children). */
	streamStart: Element;
	/** A complete depth-1 child of the stream — one stanza or negotiation element. */
	stanza: Element;
	/** The peer closed the stream (`</stream:stream>`). */
	streamEnd: void;
	error: Error;
};

export const DEFAULT_MAX_STANZA_SIZE = 262144;

const MAX_DEPTH = 32;
const MAX_ATTRIBUTES = 64;

/**
 * Streaming XMPP framing on top of ltx's SAX parser: emits the stream header once,
 * then each complete depth-1 element.
 *
 * Hardening per RFC 6120 §11.1: DOCTYPE declarations, entity definitions, comments,
 * CDATA sections and processing instructions (except a leading XML declaration) are
 * rejected outright. ltx itself never expands custom entities, so this is
 * defense-in-depth against restricted XML rather than a billion-laughs patch.
 */
export class StanzaParser extends Emitter<StanzaParserEvents> {
	private parser: SaxLtx;

	private root: Element | undefined;

	private current: Element | undefined;

	private depth = 0;

	private stanzaBytes = 0;

	private sawFirstBytes = false;

	private lastChar = '';

	private failed = false;

	private readonly maxStanzaSize: number;

	constructor(opts: { maxStanzaSize?: number } = {}) {
		super();
		this.maxStanzaSize = opts.maxStanzaSize ?? DEFAULT_MAX_STANZA_SIZE;
		this.parser = this.createParser();
	}

	private createParser(): SaxLtx {
		const parser = new SaxLtx();

		parser.on('startElement', (name, attrs) => {
			if (this.failed) {
				return;
			}

			if (Object.keys(attrs).length > MAX_ATTRIBUTES) {
				return this.fail(new Error('Too many attributes'));
			}

			this.depth += 1;
			if (this.depth > MAX_DEPTH) {
				return this.fail(new Error('Maximum element depth exceeded'));
			}

			if (this.depth === 1) {
				this.root = new Element(name, attrs);
				this.emit('streamStart', this.root);
				return;
			}

			const child = new Element(name, attrs);
			if (this.current) {
				this.current.cnode(child);
			}
			this.current = child;
		});

		parser.on('endElement', (name) => {
			if (this.failed) {
				return;
			}

			this.depth -= 1;

			if (this.depth === 0) {
				this.emit('streamEnd');
				return;
			}

			if (this.depth < 0) {
				return this.fail(new Error('Unbalanced XML'));
			}

			if (this.current?.name !== name) {
				return this.fail(new Error('Mismatched closing tag'));
			}

			if (this.depth === 1) {
				const stanza = this.current;
				this.current = undefined;
				this.stanzaBytes = 0;
				this.emit('stanza', stanza);
				return;
			}

			this.current = this.current.parent ?? undefined;
		});

		parser.on('text', (text) => {
			if (!this.failed && this.current) {
				this.current.t(text);
			}
		});

		parser.on('error', (error) => this.fail(error));

		return parser;
	}

	write(data: Buffer | string): void {
		if (this.failed) {
			return;
		}

		const text = typeof data === 'string' ? data : data.toString('utf8');

		// RFC 6120 restricted-xml: any literal `<!` is a comment, DOCTYPE or CDATA section —
		// all prohibited. `<?` is only tolerated as the very first bytes (XML declaration).
		// The boundary check catches sequences split across chunks.
		if (text.includes('<!') || (this.lastChar === '<' && text.startsWith('!'))) {
			return this.fail(new Error('Restricted XML (comment, DOCTYPE or CDATA) is not allowed'));
		}

		let toParse = text;
		if (!this.sawFirstBytes) {
			this.sawFirstBytes = true;
			toParse = toParse.replace(/^\s*<\?xml[^?]*\?>/, '');
		}
		if (toParse.includes('<?') || (this.lastChar === '<' && toParse.startsWith('?'))) {
			return this.fail(new Error('Processing instructions are not allowed'));
		}
		this.lastChar = text.charAt(text.length - 1);

		if (this.depth >= 1) {
			this.stanzaBytes += Buffer.byteLength(toParse);
			if (this.stanzaBytes > this.maxStanzaSize) {
				return this.fail(new Error('Stanza size limit exceeded'));
			}
		}

		try {
			this.parser.write(toParse);
		} catch (error) {
			this.fail(error instanceof Error ? error : new Error(String(error)));
		}
	}

	/** Discards all parser state — required for the mandatory stream restart after STARTTLS/SASL. */
	reset(): void {
		this.parser.removeAllListeners();
		this.parser = this.createParser();
		this.root = undefined;
		this.current = undefined;
		this.depth = 0;
		this.stanzaBytes = 0;
		this.sawFirstBytes = false;
		this.lastChar = '';
		this.failed = false;
	}

	private fail(error: Error): void {
		if (this.failed) {
			return;
		}
		this.failed = true;
		this.emit('error', error);
	}
}
