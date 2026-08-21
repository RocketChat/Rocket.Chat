import crypto from 'crypto';

import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
	buildClientAssertion,
	certificateThumbprintSha256,
} from '../../../../../ee/server/lib/calendarSync/providers/graph/clientAssertion';

// Self-signed test certificate (no secret material); SHA-256 fingerprint:
// 3B:4A:83:CF:20:D8:F7:B1:EF:83:C9:AD:21:86:98:FE:86:D6:AF:05:E3:96:6A:F3:68:56:8B:C7:CF:6E:80:57
const TEST_CERT = `-----BEGIN CERTIFICATE-----
MIICtjCCAZ4CCQDMv8cc+9Zt7DANBgkqhkiG9w0BAQsFADAdMRswGQYDVQQDDBJj
YWxlbmRhci1zeW5jLXRlc3QwHhcNMjYwNzExMjIzNjU4WhcNMzYwNzA4MjIzNjU4
WjAdMRswGQYDVQQDDBJjYWxlbmRhci1zeW5jLXRlc3QwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDFwL8KF/OtOtGBekuepBXZ26HuuhO+RE1DX1F5X1iR
esG/ysOgi+tmHMS+XJz4aMHZ6+e4A8gappvopegC8/TyOgZf5GqkESEc0IqY3DFo
DxMuR/hPmgSw7x/kM7b3vEmB/IThni5blOek+2A+pRdcPYuNWTcHXPt8gpSDCqQA
ppvjgp5601NUg7MUMoLCmAfWFZNVXhVa2M8pnvXl4Q5nxwdFFEjXPX5ko1QXKsJa
5j72AhPjbPjrGoYhforRb5zhLo38KK4odFO4/LRW4VzWz0+aHwnY120Phz8lPbAi
7GgvuxA2LRlByRRHgPTLU19Ze5rtxzl65d0CUl+wu3HrAgMBAAEwDQYJKoZIhvcN
AQELBQADggEBAI7Axqc8DHooUuORy1otGK5f+6uSZaEVUCTBdpJIcBH3hevgK/4S
pr1pKX7EzkEH6qvfLh4nAVtdqOaiMElStNEmdphO+QISPRf0Z73LMjn+DWDA2Itm
pxUmvAlFM60YQ8P6gt+c6bY1WeP0Lscljunreywug1yC112HmV7u5bAaARZJZKyE
oLLbetiyukt9uDnEttIBt96I4XzEjCbCd4FOuVXtr5CoCIOoCHCFrfHPw98WA4fl
VPkIVs97CgYMq+qvQNbNnNETnvcx9m0V7yFSRojNQzrmhIBh0Eh9XK/nwvJy6Qcc
Z7VrHhPvCjx/LWvTh5gGh8tB9mwKCDriqZA=
-----END CERTIFICATE-----`;

const b64urlDecode = (part: string): Buffer => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

describe('calendarSync/graph/clientAssertion', () => {
	describe('certificateThumbprintSha256', () => {
		it('should compute the base64url-encoded SHA-256 thumbprint of the DER certificate', () => {
			const expected = Buffer.from('3B4A83CF20D8F7B1EF83C9AD218698FE86D6AF05E3966AF368568BC7CF6E8057', 'hex')
				.toString('base64')
				.replace(/=+$/, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_');
			expect(certificateThumbprintSha256(TEST_CERT)).to.equal(expected);
		});

		it('should reject values that are not PEM certificates', () => {
			expect(() => certificateThumbprintSha256('not a cert'))
				.to.throw()
				.and.satisfy((error: any) => error.code === 'invalid-certificate');
		});
	});

	describe('buildClientAssertion', () => {
		const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
		const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

		it('should produce an RS256 JWT with the x5t#S256 header and Entra-compatible claims, verifiable with the public key', () => {
			const tokenUrl = 'https://login.microsoftonline.us/tenant-1/oauth2/v2.0/token';
			const now = new Date('2026-07-11T12:00:00Z').getTime();

			const assertion = buildClientAssertion({
				clientId: 'client-1',
				tokenUrl,
				certificatePem: TEST_CERT,
				privateKeyPem,
				now,
				jti: 'fixed-jti',
			});

			const [headerPart, payloadPart, signaturePart] = assertion.split('.');
			const header = JSON.parse(b64urlDecode(headerPart).toString());
			const payload = JSON.parse(b64urlDecode(payloadPart).toString());

			expect(header).to.deep.equal({ 'alg': 'RS256', 'typ': 'JWT', 'x5t#S256': certificateThumbprintSha256(TEST_CERT) });
			expect(payload.aud).to.equal(tokenUrl);
			expect(payload.iss).to.equal('client-1');
			expect(payload.sub).to.equal('client-1');
			expect(payload.jti).to.equal('fixed-jti');
			expect(payload.exp - payload.iat).to.equal(600);
			expect(payload.nbf).to.equal(payload.iat - 60);

			const verified = crypto
				.createVerify('RSA-SHA256')
				.update(`${headerPart}.${payloadPart}`)
				.verify(publicKey, b64urlDecode(signaturePart));
			expect(verified).to.be.true;
		});

		it('should fail with invalid-private-key on garbage key material', () => {
			expect(() =>
				buildClientAssertion({ clientId: 'c', tokenUrl: 'https://x/token', certificatePem: TEST_CERT, privateKeyPem: 'garbage' }),
			)
				.to.throw()
				.and.satisfy((error: any) => error.code === 'invalid-private-key');
		});
	});
});
