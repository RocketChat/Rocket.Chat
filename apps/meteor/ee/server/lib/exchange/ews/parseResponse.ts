import { DOMParser } from '@xmldom/xmldom';

import type { ExchangeErrorCode } from '../errors';
import { ExchangeError } from '../errors';

export const TYPES_NS = 'http://schemas.microsoft.com/exchange/services/2006/types';
export const MESSAGES_NS = 'http://schemas.microsoft.com/exchange/services/2006/messages';

const BENIGN_RESPONSE_CODES = new Set(['NoError', 'ErrorNameResolutionMultipleResults']);

const RESPONSE_CODE_TO_ERROR: Record<string, { code: ExchangeErrorCode; message: string }> = {
	ErrorAccessDenied: { code: 'authorization-failed', message: 'The service account is not allowed to access this mailbox' },
	ErrorImpersonateUserDenied: {
		code: 'authorization-failed',
		message: 'The service account lacks the ApplicationImpersonation role for this mailbox',
	},
	ErrorImpersonationDenied: { code: 'authorization-failed', message: 'Impersonation was denied by the Exchange server' },
	ErrorNonExistentMailbox: { code: 'mailbox-not-found', message: 'The mailbox does not exist on this Exchange server' },
	ErrorNameResolutionNoResults: { code: 'mailbox-not-found', message: 'Exchange could not resolve the mailbox address' },
	ErrorInvalidSyncStateData: { code: 'unexpected-response', message: 'The stored sync state is no longer valid and must be reset' },
};

const parseXml = (xml: string): Document => {
	let fatal: string | undefined;

	const parsed = new DOMParser({
		errorHandler: {
			fatalError: (err: unknown) => {
				fatal = err instanceof Error ? err.message : String(err);
			},
		},
	}).parseFromString(xml, 'text/xml');

	if (fatal || !parsed?.documentElement) {
		throw new ExchangeError('unexpected-response', 'Exchange returned a body that is not valid XML', {
			detail: fatal?.slice(0, 300),
		});
	}

	return parsed;
};

export const textOf = (node: Element | null | undefined): string | undefined => {
	const value = node?.textContent?.trim();
	return value || undefined;
};

export const firstByTag = (scope: Document | Element, ns: string, tag: string): Element | undefined =>
	scope.getElementsByTagNameNS(ns, tag)[0] ?? undefined;

export const allByTag = (scope: Document | Element, ns: string, tag: string): Element[] =>
	Array.from(scope.getElementsByTagNameNS(ns, tag) as unknown as ArrayLike<Element>);

/** Exchange returns faults with HTTP 500, so the transport cannot tell them from a real server error. */
const assertNoSoapFault = (doc: Document): void => {
	const fault = doc.getElementsByTagName('soap:Fault')[0] ?? doc.getElementsByTagName('Fault')[0];
	if (!fault) {
		return;
	}

	const reason =
		textOf(fault.getElementsByTagName('faultstring')[0]) ?? textOf(firstByTag(fault, MESSAGES_NS, 'MessageText')) ?? 'Unknown SOAP fault';

	throw new ExchangeError('unexpected-response', 'Exchange rejected the request', { detail: reason.slice(0, 300) });
};

/**
 * Mapped to typed errors where we recognise the code, so Test Connection can tell "wrong password" from
 * "impersonation not granted": very different things for an admin to act on.
 */
const assertNoResponseCodeErrors = (doc: Document): void => {
	for (const node of allByTag(doc, MESSAGES_NS, 'ResponseCode')) {
		const code = textOf(node);
		if (!code || BENIGN_RESPONSE_CODES.has(code)) {
			continue;
		}

		const mapped = RESPONSE_CODE_TO_ERROR[code];
		const messageText = textOf(firstByTag(doc, MESSAGES_NS, 'MessageText'));

		if (mapped) {
			throw new ExchangeError(mapped.code, mapped.message, { detail: messageText ?? code });
		}

		throw new ExchangeError('unexpected-response', `Exchange returned ${code}`, { detail: messageText });
	}
};

/**
 * Well formed HTML is also well formed XML, so a proxy error page with HTTP 200 would parse cleanly, match
 * nothing, and be read as "the mailbox has no events".
 */
const assertIsSoapEnvelope = (doc: Document): void => {
	const root = doc.documentElement;
	const localName = root.localName ?? root.nodeName.replace(/^.*:/, '');

	if (localName !== 'Envelope') {
		throw new ExchangeError('unexpected-response', 'Exchange returned a document that is not a SOAP envelope', {
			detail: `root element was <${root.nodeName}>`,
		});
	}
};

/**
 * Shared across every operation because EWS reports failure two ways, and handling only the first is how
 * a partial failure gets read as success:
 *
 * 1. A SOAP fault, when the whole request was rejected.
 * 2. A per-item `ResponseCode` inside an HTTP 200, when some items succeeded and others did not.
 */
export const parseEwsResponse = (xml: string): Document => {
	const doc = parseXml(xml);
	assertIsSoapEnvelope(doc);
	assertNoSoapFault(doc);
	assertNoResponseCodeErrors(doc);
	return doc;
};
