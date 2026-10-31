import crypto from 'node:crypto';
import { describe, it } from 'node:test';

import { expect } from 'chai';

import { signatureAlgorithms } from './signatureAlgorithms';
import { validateRedirectSignature } from './validateRedirectSignature';
import { privateKey, privateKeyCert } from '../../../../../../tests/mocks/server/lib/saml/data';
import type { SAMLRedirectEnvelope } from '../../definition/SAMLEnvelope';

const certificate = privateKeyCert.replace(/-----[A-Z ]+-----|\s/g, '');
const signedContent = 'SAMLRequest=request&RelayState=state&SigAlg=algorithm';

const sign = (content: string, key: crypto.KeyLike = privateKey, algorithm = 'RSA-SHA256') =>
	crypto.createSign(algorithm).update(content, 'utf8').sign(key, 'base64');

const buildEnvelope = (overrides: Partial<SAMLRedirectEnvelope> = {}) =>
	({
		type: 'SAMLRequest',
		signedContent,
		signature: sign(signedContent),
		sigAlg: signatureAlgorithms['RSA-SHA256'],
		...overrides,
	}) as SAMLRedirectEnvelope;

describe('validateRedirectSignature', () => {
	it('should accept a document signed with the key of the configured certificate', () => {
		expect(validateRedirectSignature(buildEnvelope(), certificate)).to.be.true;
	});

	it('should reject a document with no signature', () => {
		expect(validateRedirectSignature(buildEnvelope({ signature: undefined }), certificate)).to.be.false;
	});

	it('should reject a document that does not declare its algorithm', () => {
		expect(validateRedirectSignature(buildEnvelope({ sigAlg: undefined }), certificate)).to.be.false;
	});

	it('should reject a document with no signed content', () => {
		expect(validateRedirectSignature(buildEnvelope({ signedContent: '' }), certificate)).to.be.false;
	});

	it('should reject a document changed after it was signed', () => {
		const envelope = buildEnvelope({ signedContent: `${signedContent}&RelayState=https://attacker.example` });

		expect(validateRedirectSignature(envelope, certificate)).to.be.false;
	});

	it('should reject a document signed with a key that does not belong to the certificate', () => {
		const { privateKey: otherKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
		const envelope = buildEnvelope({ signature: sign(signedContent, otherKey) });

		expect(validateRedirectSignature(envelope, certificate)).to.be.false;
	});

	it('should reject a signature made with another algorithm than the one the document declares', () => {
		const envelope = buildEnvelope({ signature: sign(signedContent, privateKey, 'RSA-SHA512') });

		expect(validateRedirectSignature(envelope, certificate)).to.be.false;
	});

	it('should reject a document with an algorithm outside the supported list', () => {
		const envelope = buildEnvelope({
			signature: sign(signedContent, privateKey, 'RSA-SHA224'),
			sigAlg: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha224',
		});

		expect(validateRedirectSignature(envelope, certificate)).to.be.false;
	});

	it('should reject the document instead of throwing when the certificate is not usable', () => {
		expect(validateRedirectSignature(buildEnvelope(), '')).to.be.false;
	});
});
