import { DOMParser } from '@xmldom/xmldom';

import type { ExchangeErrorCode } from '../errors';
import { ExchangeError } from '../errors';

export const TYPES_NS = 'http://schemas.microsoft.com/exchange/services/2006/types';
export const MESSAGES_NS = 'http://schemas.microsoft.com/exchange/services/2006/messages';
/** Where a SOAP fault names its `ResponseCode`. An operation uses `MESSAGES_NS` for the same element. */
export const ERRORS_NS = 'http://schemas.microsoft.com/exchange/services/2006/errors';

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
	ErrorInvalidSyncStateData: { code: 'sync-state-invalid', message: 'The stored sync state is no longer valid and must be reset' },
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
			detail: fatal,
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

const responseCodesIn = (scope: Document | Element): Element[] => [
	...allByTag(scope, MESSAGES_NS, 'ResponseCode'),
	...allByTag(scope, ERRORS_NS, 'ResponseCode'),
];

const toExchangeError = (code: string, detail: string | undefined): ExchangeError => {
	const mapped = RESPONSE_CODE_TO_ERROR[code];

	return mapped
		? new ExchangeError(mapped.code, mapped.message, { detail: detail ?? code })
		: new ExchangeError('unexpected-response', `Exchange returned ${code}`, { detail });
};

/**
 * Exchange returns faults with HTTP 500, so the transport cannot tell them from a real server error. Matched
 * by local name because the prefix is the server's choice: Exchange sends `s:Fault`, which a lookup for
 * `soap:Fault` never sees, and missing the fault is what makes a rejected mailbox read as an empty calendar.
 */
const assertNoSoapFault = (doc: Document): void => {
	const fault = firstByTag(doc, '*', 'Fault');
	if (!fault) {
		return;
	}

	const reason = textOf(fault.getElementsByTagName('faultstring')[0]) ?? textOf(firstByTag(fault, MESSAGES_NS, 'MessageText'));
	const code = textOf(responseCodesIn(fault)[0]);

	if (code) {
		throw toExchangeError(code, reason?.slice(0, 300));
	}

	throw new ExchangeError('unexpected-response', 'Exchange rejected the request', {
		detail: (reason ?? 'Unknown SOAP fault').slice(0, 300),
	});
};

const assertNoResponseCodeErrors = (doc: Document): void => {
	for (const node of responseCodesIn(doc)) {
		const code = textOf(node);
		if (!code || BENIGN_RESPONSE_CODES.has(code)) {
			continue;
		}

		throw toExchangeError(code, textOf(firstByTag(doc, MESSAGES_NS, 'MessageText')));
	}
};

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
