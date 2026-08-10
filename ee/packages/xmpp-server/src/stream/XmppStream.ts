import type net from 'node:net';
import tls from 'node:tls';

import { Emitter } from '@rocket.chat/emitter';
import { escapeXML } from 'ltx';
import type Element from 'ltx/lib/Element';

import type { Logger } from '../logger';
import { StanzaParser } from '../xml/StanzaParser';
import { NS_DIALBACK, NS_SERVER, NS_STREAMS, NS_STREAM_ERRORS } from '../xml/namespaces';

const TLS_HANDSHAKE_TIMEOUT_MS = 10000;
const GRACEFUL_CLOSE_TIMEOUT_MS = 2000;

export type XmppStreamEvents = {
	streamStart: Element;
	stanza: Element;
	closed: { error?: Error };
};

/**
 * Owns one socket (plain or TLS) and one StanzaParser. Direction-agnostic stream
 * mechanics: header exchange, stanza framing, STARTTLS upgrade, graceful close.
 */
export class XmppStream extends Emitter<XmppStreamEvents> {
	private socket: net.Socket | tls.TLSSocket;

	private parser: StanzaParser;

	private closedEmitted = false;

	private readonly maxStanzaSize?: number;

	private readonly logger: Logger;

	constructor(socket: net.Socket | tls.TLSSocket, opts: { maxStanzaSize?: number; logger: Logger }) {
		super();
		this.socket = socket;
		this.maxStanzaSize = opts.maxStanzaSize;
		this.logger = opts.logger;
		this.parser = this.createParser();
		this.attachSocket(socket);
	}

	private createParser(): StanzaParser {
		const parser = new StanzaParser({ maxStanzaSize: this.maxStanzaSize });
		parser.on('streamStart', (el) => this.emit('streamStart', el));
		parser.on('stanza', (el) => this.emit('stanza', el));
		parser.on('streamEnd', () => {
			void this.close();
		});
		parser.on('error', (error) => {
			this.logger.debug({ err: error }, 'XML stream error');
			void this.close({ condition: 'not-well-formed' });
		});
		return parser;
	}

	private attachSocket(socket: net.Socket | tls.TLSSocket): void {
		socket.on('data', (data: Buffer) => this.parser.write(data));
		socket.on('error', (error: Error) => {
			this.destroy(error);
		});
		socket.on('close', () => {
			this.destroy();
		});
	}

	private detachSocket(socket: net.Socket | tls.TLSSocket): void {
		socket.removeAllListeners('data');
		socket.removeAllListeners('error');
		socket.removeAllListeners('close');
	}

	/** Writes the opening `<stream:stream>` tag (optionally preceded by an XML declaration). */
	openStream(attrs: { from?: string; to?: string; id?: string }): void {
		const parts = [
			`<?xml version='1.0'?>`,
			`<stream:stream xmlns='${NS_SERVER}' xmlns:db='${NS_DIALBACK}' xmlns:stream='${NS_STREAMS}' version='1.0'`,
		];
		for (const [name, value] of Object.entries(attrs)) {
			if (value) {
				parts.push(` ${name}='${escapeXML(value)}'`);
			}
		}
		parts.push('>');
		this.sendRaw(parts.join(''));
	}

	send(el: Element): void {
		this.sendRaw(el.toString());
	}

	sendRaw(xml: string): void {
		if (this.socket.destroyed || !this.socket.writable) {
			return;
		}
		this.socket.write(xml);
	}

	/**
	 * Upgrades the underlying socket to TLS. The caller must have sent/received
	 * `<proceed/>` already. Rejects (and destroys the socket) on handshake timeout.
	 */
	upgradeToTls(options: tls.TlsOptions & { isServer: boolean; servername?: string }): Promise<tls.TLSSocket> {
		return new Promise((resolve, reject) => {
			const rawSocket = this.socket;
			this.detachSocket(rawSocket);

			const timeout = setTimeout(() => {
				tlsSocket.destroy();
				reject(new Error('TLS handshake timeout'));
			}, TLS_HANDSHAKE_TIMEOUT_MS);

			const onEstablished = () => {
				clearTimeout(timeout);
				this.socket = tlsSocket;
				this.attachSocket(tlsSocket);
				resolve(tlsSocket);
			};

			let tlsSocket: tls.TLSSocket;
			if (options.isServer) {
				tlsSocket = new tls.TLSSocket(rawSocket, {
					isServer: true,
					secureContext: tls.createSecureContext(options),
					requestCert: true,
					rejectUnauthorized: false,
				});
				tlsSocket.once('secure', onEstablished);
			} else {
				tlsSocket = tls.connect({
					socket: rawSocket,
					servername: options.servername,
					cert: options.cert,
					key: options.key,
					ca: options.ca,
					rejectUnauthorized: false,
				});
				tlsSocket.once('secureConnect', onEstablished);
			}

			tlsSocket.once('error', (error: Error) => {
				clearTimeout(timeout);
				tlsSocket.destroy();
				reject(error);
			});
		});
	}

	/** Resets the parser for the mandatory stream restart after STARTTLS/SASL. */
	restart(): void {
		this.parser.reset();
	}

	get isSecure(): boolean {
		return this.socket instanceof tls.TLSSocket && this.socket.encrypted === true;
	}

	get peerCertificate(): tls.PeerCertificate | undefined {
		if (!(this.socket instanceof tls.TLSSocket)) {
			return undefined;
		}
		const cert = this.socket.getPeerCertificate(false);
		return cert && Object.keys(cert).length > 0 ? cert : undefined;
	}

	get tlsSocket(): tls.TLSSocket | undefined {
		return this.socket instanceof tls.TLSSocket ? this.socket : undefined;
	}

	get remoteAddress(): string | undefined {
		return this.socket.remoteAddress;
	}

	/** Sends an optional stream error and `</stream:stream>`, then destroys the socket after a bounded wait. */
	close(streamError?: { condition: string; text?: string }): Promise<void> {
		return new Promise((resolve) => {
			if (this.socket.destroyed) {
				this.destroy();
				return resolve();
			}

			if (streamError) {
				const text = streamError.text ? `<text xmlns='${NS_STREAM_ERRORS}'>${escapeXML(streamError.text)}</text>` : '';
				this.sendRaw(`<stream:error><${streamError.condition} xmlns='${NS_STREAM_ERRORS}'/>${text}</stream:error>`);
			}
			this.sendRaw('</stream:stream>');

			const timeout = setTimeout(() => {
				this.destroy();
				resolve();
			}, GRACEFUL_CLOSE_TIMEOUT_MS);
			timeout.unref();

			this.socket.once('close', () => {
				clearTimeout(timeout);
				this.destroy();
				resolve();
			});
			this.socket.end();
		});
	}

	destroy(error?: Error): void {
		if (!this.socket.destroyed) {
			this.socket.destroy();
		}
		if (!this.closedEmitted) {
			this.closedEmitted = true;
			this.emit('closed', { error });
		}
	}
}
