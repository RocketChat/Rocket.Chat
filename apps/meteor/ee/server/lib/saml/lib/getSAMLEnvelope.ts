import type { IIncomingMessage } from '@rocket.chat/core-typings';

import { SAMLUtils } from './Utils';
import type {
	SAMLEnvelope,
	SAMLBinding,
	SAMLDocumentType,
	SAMLRedirectEnvelope,
	SAMLPOSTEnvelope,
	SAMLBaseEnvelope,
} from '../definition/SAMLEnvelope';

function getStringAttribute(params: Record<string, any>, attributeName: string): string | null {
	if (!(attributeName in params)) {
		return null;
	}

	if (typeof params[attributeName] !== 'string') {
		return null;
	}

	return params[attributeName];
}

async function performBindingSpecificDecoding(binding: SAMLBinding, buffer: Buffer<ArrayBuffer>): Promise<Buffer<ArrayBuffer>> {
	switch (binding) {
		case 'HTTP-Redirect':
			return SAMLUtils.inflateXml(buffer);
		default:
			return buffer;
	}
}

async function decodeDocument(base64Data: string, binding: SAMLBinding): Promise<string> {
	const buffer = await performBindingSpecificDecoding(binding, Buffer.from(base64Data, 'base64'));

	return buffer.toString('utf8');
}

function getSignedContent(req: IIncomingMessage, documentType: SAMLDocumentType): string | null {
	// We load the signed content directly from the query string, because:
	// 1. We need the raw value, without running decodeURIComponent or any other processing/normalization
	// 2. We need to respect the order the params came in (although the order should be fixed)
	const rawUrl = req.url;
	if (!rawUrl) {
		return null;
	}

	const queryString = rawUrl.split('?')[1];
	if (!queryString) {
		return null;
	}
	const params = queryString.split('&');

	const signedContent = params
		.filter((p) => p.startsWith(`${documentType}=`) || p.startsWith(`RelayState=`) || p.startsWith('SigAlg='))
		.join('&');

	return signedContent || null;
}

export async function getSAMLEnvelope<T extends SAMLDocumentType = SAMLDocumentType>(
	req: IIncomingMessage,
	type: T,
	binding: 'HTTP-Redirect',
): Promise<SAMLRedirectEnvelope<T> | null>;
export async function getSAMLEnvelope<T extends SAMLDocumentType = SAMLDocumentType>(
	req: IIncomingMessage,
	type: T,
	binding: 'HTTP-POST',
): Promise<SAMLPOSTEnvelope<T> | null>;
export async function getSAMLEnvelope<B extends SAMLBinding, T extends SAMLDocumentType = SAMLDocumentType>(
	req: IIncomingMessage,
	type: T,
	binding: B,
): Promise<SAMLEnvelope<T> | null> {
	const params = binding === 'HTTP-Redirect' ? req.query : req.body;

	if (!params) {
		return null;
	}

	const encodedDocument = getStringAttribute(params, type);

	if (!encodedDocument) {
		return null;
	}

	const decodedDocument = await decodeDocument(encodedDocument, binding);

	const relayState = getStringAttribute(params, 'RelayState');

	const envelope: SAMLBaseEnvelope<T> = {
		binding,
		type,
		encodedDocument,
		decodedDocument,
		...(typeof relayState === 'string' && { relayState }),
	};

	if (envelope.binding !== 'HTTP-Redirect') {
		return envelope;
	}

	const signedContent = getSignedContent(req, type);

	const sigAlg = getStringAttribute(params, 'SigAlg');
	const signature = getStringAttribute(params, 'Signature');

	if (sigAlg && signature && signedContent) {
		return {
			...envelope,
			sigAlg,
			signature,
			signedContent,
		};
	}

	return envelope;
}
