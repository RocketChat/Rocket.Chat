import type net from 'node:net';

import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import { InvalidJidError } from '../errors';
import { isDomainAllowed, normalizeDomain } from '../jid/normalize';
import type { Logger } from '../logger';
import { XmppStream } from './XmppStream';
import type { DialbackVerdict } from '../s2s/dialback';
import { generateStreamId } from '../s2s/dialback';
import { verifyPeerCertForDomain } from '../s2s/saslExternal';
import { xml } from '../xml/build';
import { NS_DIALBACK, NS_DIALBACK_FEATURE, NS_SASL, NS_TLS } from '../xml/namespaces';
import { resolveElement } from '../xml/resolve';

export type InboundSessionDeps = {
	config: ResolvedXMPPServerConfig;
	logger: Logger;
	/** Receiving-server side of dialback: verify a db:result key with the claimed authoritative server. */
	requestDialbackVerification(req: { originatingDomain: string; streamId: string; key: string }): Promise<DialbackVerdict>;
	/** Authoritative-server side of dialback: validate a db:verify key generated with our secret. */
	answerDialbackVerify(req: { receivingDomain: string; originatingDomain: string; streamId: string; key: string }): 'valid' | 'invalid';
	onDomainAuthenticated(session: InboundSession, domain: string, authMethod: 'dialback' | 'sasl-external'): void;
	onStanza(stanza: Element, session: InboundSession): void;
	onClosed(session: InboundSession, error?: Error): void;
};

/**
 * Receiving-server side of one inbound S2S TCP connection.
 *
 * A single inbound connection may carry stanzas for multiple originating domains
 * (dialback authenticates domain pairs), tracked in `authenticatedFromDomains`.
 */
export class InboundSession {
	readonly authenticatedFromDomains = new Set<string>();

	private readonly stream: XmppStream;

	private readonly logger: Logger;

	private streamId = generateStreamId();

	private streamHeader: Element | undefined;

	private peerFromDomain: string | undefined;

	private saslAuthenticatedDomain: string | undefined;

	private closed = false;

	constructor(
		socket: net.Socket,
		private readonly deps: InboundSessionDeps,
	) {
		this.logger = deps.logger.child({ direction: 'inbound', remote: socket.remoteAddress });
		this.stream = new XmppStream(socket, { maxStanzaSize: deps.config.maxStanzaSize, logger: this.logger });

		this.stream.on('streamStart', (header) => this.onStreamStart(header));
		this.stream.on('stanza', (stanza) => {
			this.onStanza(stanza).catch((error) => {
				this.logger.error({ err: error }, 'Error handling inbound stanza');
			});
		});
		this.stream.on('closed', ({ error }) => {
			if (!this.closed) {
				this.closed = true;
				this.deps.onClosed(this, error);
			}
		});
	}

	get isSecure(): boolean {
		return this.stream.isSecure;
	}

	get remoteAddress(): string | undefined {
		return this.stream.remoteAddress;
	}

	send(el: Element): void {
		this.stream.send(el);
	}

	async close(streamError?: { condition: string; text?: string }): Promise<void> {
		await this.stream.close(streamError);
	}

	destroy(): void {
		this.stream.destroy();
	}

	private onStreamStart(header: Element): void {
		this.streamHeader = header;

		const to = header.attrs.to && this.safeNormalize(header.attrs.to);
		const { config } = this.deps;
		if (!to || (to !== config.domain && to !== config.mucDomain)) {
			void this.stream.close({ condition: 'host-unknown' });
			return;
		}

		if (header.attrs.from) {
			const from = this.safeNormalize(header.attrs.from);
			if (!from || !isDomainAllowed(from, config.allowedDomains, config.deniedDomains)) {
				void this.stream.close({ condition: 'policy-violation' });
				return;
			}
			this.peerFromDomain = from;
		}

		// Fresh id per stream (incl. post-TLS/SASL restarts) — dialback keys bind to it
		this.streamId = generateStreamId();
		this.stream.openStream({ from: header.attrs.to, id: this.streamId });

		// A SASL EXTERNAL success authenticates the restarted stream that follows it
		if (this.saslAuthenticatedDomain) {
			this.addAuthenticatedDomain(this.saslAuthenticatedDomain, 'sasl-external');
			this.saslAuthenticatedDomain = undefined;
		}

		this.sendFeatures();
	}

	private sendFeatures(): void {
		const { config } = this.deps;
		const features = xml('stream:features');

		if (!this.stream.isSecure && config.tls) {
			const starttls = xml('starttls', { xmlns: NS_TLS });
			if (config.requireTls) {
				starttls.c('required');
			}
			features.cnode(starttls);
			// No authentication is offered until the stream is secured (when TLS is required)
			if (config.requireTls) {
				this.stream.send(features);
				return;
			}
		}

		if (config.saslExternalEnabled && this.canOfferSaslExternal()) {
			features.cnode(xml('mechanisms', { xmlns: NS_SASL }, xml('mechanism', {}, 'EXTERNAL')));
		}

		if (config.dialbackEnabled) {
			features.cnode(xml('dialback', { xmlns: NS_DIALBACK_FEATURE }));
		}

		this.stream.send(features);
	}

	private canOfferSaslExternal(): boolean {
		const { tlsSocket } = this.stream;
		if (!tlsSocket || !this.peerFromDomain) {
			return false;
		}
		return verifyPeerCertForDomain(tlsSocket, this.peerFromDomain);
	}

	private async onStanza(stanza: Element): Promise<void> {
		const { localName, ns } = resolveElement(stanza, this.streamHeader);

		if (ns === NS_TLS && localName === 'starttls') {
			return this.handleStartTls();
		}

		if (ns === NS_SASL && localName === 'auth') {
			return this.handleSaslAuth(stanza);
		}

		if (ns === NS_DIALBACK && localName === 'result') {
			return this.handleDialbackResult(stanza);
		}

		if (ns === NS_DIALBACK && localName === 'verify') {
			return this.handleDialbackVerify(stanza);
		}

		if (localName === 'message' || localName === 'presence' || localName === 'iq') {
			return this.handleContentStanza(stanza);
		}

		this.logger.debug({ name: stanza.name, ns }, 'Ignoring unexpected inbound element');
	}

	private async handleStartTls(): Promise<void> {
		const { config } = this.deps;
		if (!config.tls || this.stream.isSecure) {
			this.stream.send(xml('failure', { xmlns: NS_TLS }));
			await this.stream.close();
			return;
		}

		this.stream.send(xml('proceed', { xmlns: NS_TLS }));
		try {
			await this.stream.upgradeToTls({ isServer: true, cert: config.tls.cert, key: config.tls.key, ca: config.tls.ca });
			this.stream.restart();
		} catch (error) {
			this.logger.debug({ err: error }, 'Inbound STARTTLS failed');
			this.stream.destroy();
		}
	}

	private async handleSaslAuth(stanza: Element): Promise<void> {
		const failure = async (condition: string) => {
			this.stream.send(xml('failure', { xmlns: NS_SASL }, xml(condition)));
			await this.stream.close();
		};

		if (stanza.attrs.mechanism !== 'EXTERNAL' || !this.deps.config.saslExternalEnabled) {
			return failure('invalid-mechanism');
		}

		const { tlsSocket } = this.stream;
		if (!tlsSocket) {
			return failure('encryption-required');
		}

		const encoded = stanza.getText().trim();
		const authzid = encoded && encoded !== '=' ? Buffer.from(encoded, 'base64').toString('utf8') : '';
		const domain = authzid ? this.safeNormalize(authzid) : this.peerFromDomain;

		if (!domain || !isDomainAllowed(domain, this.deps.config.allowedDomains, this.deps.config.deniedDomains)) {
			return failure('invalid-authzid');
		}

		if (!verifyPeerCertForDomain(tlsSocket, domain)) {
			return failure('not-authorized');
		}

		this.saslAuthenticatedDomain = domain;
		this.stream.send(xml('success', { xmlns: NS_SASL }));
		this.stream.restart();
	}

	private async handleDialbackResult(stanza: Element): Promise<void> {
		// db:result with a type attribute is the answer to an originating server —
		// only relevant on outbound streams, ignore here
		if (stanza.attrs.type) {
			this.logger.debug({ type: stanza.attrs.type }, 'Ignoring typed db:result on inbound stream');
			return;
		}

		const { config } = this.deps;
		if (!config.dialbackEnabled) {
			await this.stream.close({ condition: 'policy-violation' });
			return;
		}

		if (config.requireTls && !this.stream.isSecure) {
			await this.stream.close({ condition: 'policy-violation', text: 'TLS is required' });
			return;
		}

		const originatingDomain = stanza.attrs.from && this.safeNormalize(stanza.attrs.from);
		const to = stanza.attrs.to && this.safeNormalize(stanza.attrs.to);
		const key = stanza.getText().trim();

		if (!originatingDomain || !key || !to || (to !== config.domain && to !== config.mucDomain)) {
			await this.stream.close({ condition: 'improper-addressing' });
			return;
		}

		if (!isDomainAllowed(originatingDomain, config.allowedDomains, config.deniedDomains)) {
			this.stream.send(xml('db:result', { from: to, to: originatingDomain, type: 'error' }));
			return;
		}

		const { streamId } = this;
		const verdict = await this.deps.requestDialbackVerification({ originatingDomain, streamId, key });

		if (verdict === 'valid') {
			this.addAuthenticatedDomain(originatingDomain, 'dialback');
			this.stream.send(xml('db:result', { from: to, to: originatingDomain, type: 'valid' }));
			return;
		}

		this.stream.send(xml('db:result', { from: to, to: originatingDomain, type: verdict === 'invalid' ? 'invalid' : 'error' }));
		if (verdict === 'invalid') {
			await this.stream.close({ condition: 'not-authorized' });
		}
	}

	private async handleDialbackVerify(stanza: Element): Promise<void> {
		const receivingDomain = stanza.attrs.from && this.safeNormalize(stanza.attrs.from);
		const originatingDomain = stanza.attrs.to && this.safeNormalize(stanza.attrs.to);
		const streamId = stanza.attrs.id;
		const key = stanza.getText().trim();

		if (!receivingDomain || !originatingDomain || !streamId || !key) {
			await this.stream.close({ condition: 'improper-addressing' });
			return;
		}

		const verdict = this.deps.answerDialbackVerify({ receivingDomain, originatingDomain, streamId, key });
		this.stream.send(xml('db:verify', { from: originatingDomain, to: receivingDomain, id: streamId, type: verdict }));
	}

	private async handleContentStanza(stanza: Element): Promise<void> {
		const { from } = stanza.attrs;
		const { to } = stanza.attrs;
		if (!from || !to) {
			return this.logger.debug({ name: stanza.name }, 'Dropping stanza without addressing');
		}

		const fromDomain = this.safeNormalize(from.split('/')[0].split('@').pop() as string);
		if (!fromDomain || !this.authenticatedFromDomains.has(fromDomain)) {
			return this.logger.warn({ from, remote: this.remoteAddress }, 'Dropping stanza from unauthenticated domain');
		}

		const toDomain = this.safeNormalize(to.split('/')[0].split('@').pop() as string);
		const { config } = this.deps;
		if (!toDomain || (toDomain !== config.domain && toDomain !== config.mucDomain)) {
			return this.logger.debug({ to }, 'Dropping stanza not addressed to this server');
		}

		this.deps.onStanza(stanza, this);
	}

	private addAuthenticatedDomain(domain: string, authMethod: 'dialback' | 'sasl-external'): void {
		if (this.authenticatedFromDomains.has(domain)) {
			return;
		}
		this.authenticatedFromDomains.add(domain);
		this.deps.onDomainAuthenticated(this, domain, authMethod);
	}

	private safeNormalize(domain: string): string | undefined {
		try {
			return normalizeDomain(domain);
		} catch (error) {
			if (error instanceof InvalidJidError) {
				return undefined;
			}
			throw error;
		}
	}
}
