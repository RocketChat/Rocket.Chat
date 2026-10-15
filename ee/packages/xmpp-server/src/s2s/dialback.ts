import crypto from 'node:crypto';

/**
 * XEP-0185 dialback key: HMAC-SHA256 keyed with the HEX-ENCODED SHA256 of the
 * secret (per the XEP's examples) over `{receiving domain} {originating domain} {stream id}`.
 * Domains must be normalized by the caller before key derivation.
 */
export function generateDialbackKey(secret: string, receivingDomain: string, originatingDomain: string, streamId: string): string {
	const key = crypto.createHash('sha256').update(secret, 'utf8').digest('hex');
	return crypto.createHmac('sha256', key).update(`${receivingDomain} ${originatingDomain} ${streamId}`, 'utf8').digest('hex');
}

export function verifyDialbackKey(
	secret: string,
	receivingDomain: string,
	originatingDomain: string,
	streamId: string,
	presentedKey: string,
): boolean {
	const expected = generateDialbackKey(secret, receivingDomain, originatingDomain, streamId);
	const presented = Buffer.from(presentedKey, 'utf8');
	const expectedBuf = Buffer.from(expected, 'utf8');
	if (presented.length !== expectedBuf.length) {
		return false;
	}
	return crypto.timingSafeEqual(presented, expectedBuf);
}

export type DialbackVerdict = 'valid' | 'invalid' | 'error';

export function generateStreamId(): string {
	// Dialback keys are derived from the stream id, so it must be unguessable
	return crypto.randomBytes(16).toString('hex');
}
