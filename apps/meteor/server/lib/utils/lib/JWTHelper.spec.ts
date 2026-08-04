import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const jsrsasignStub = {
	KJUR: {
		jws: {
			IntDate: {
				get: sinon.stub(),
			},
			JWS: {
				sign: sinon.stub(),
				verify: sinon.stub(),
				parse: sinon.stub(),
			},
		},
	},
};

const { generateJWT, validateAndDecodeJWT } = proxyquire.noCallThru().load('./JWTHelper', {
	jsrsasign: jsrsasignStub,
});

describe('JWTHelper', () => {
	beforeEach(() => {
		jsrsasignStub.KJUR.jws.IntDate.get.reset();
		jsrsasignStub.KJUR.jws.JWS.sign.reset();
		jsrsasignStub.KJUR.jws.JWS.verify.reset();
		jsrsasignStub.KJUR.jws.JWS.parse.reset();
	});

	describe('generateJWT', () => {
		it('should generate a JWT with the correct payload structure', () => {
			const now = 1609459200;
			const expiryDuration = 3600; // 1 hour in seconds
			const expiryTime = now + expiryDuration;

			jsrsasignStub.KJUR.jws.IntDate.get.callsFake((timeStr) => {
				if (timeStr === 'now') return now;
				if (timeStr === 'now + 1hour') return expiryTime;
				return now;
			});
			jsrsasignStub.KJUR.jws.JWS.sign.returns('mocked.jwt.token');

			const payload = { userId: 'user-123', roomId: 'room-456' };
			const secret = 'test-secret';

			const result = generateJWT(payload, secret);

			expect(result).to.equal('mocked.jwt.token');
			expect(jsrsasignStub.KJUR.jws.JWS.sign.calledOnce).to.be.true;

			const signArgs = jsrsasignStub.KJUR.jws.JWS.sign.firstCall.args;
			expect(signArgs[0]).to.equal('HS256');
			expect(signArgs[1]).to.equal(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));

			const tokenPayload = JSON.parse(signArgs[2]);
			expect(tokenPayload.iat).to.equal(now);
			expect(tokenPayload.nbf).to.equal(now);
			expect(tokenPayload.exp).to.equal(expiryTime);
			expect(tokenPayload.aud).to.equal('RocketChat');
			expect(tokenPayload.context).to.deep.equal(payload);

			expect(signArgs[3]).to.deep.equal({ rstr: secret });
		});

		it('should include the provided payload in the context field', () => {
			jsrsasignStub.KJUR.jws.IntDate.get.returns(1609459200);
			jsrsasignStub.KJUR.jws.JWS.sign.returns('mocked.jwt.token');

			const payload = { fileId: 'file-123', rid: 'room-123', userId: 'user-123' };
			const secret = 'secret-key';

			generateJWT(payload, secret);

			const signArgs = jsrsasignStub.KJUR.jws.JWS.sign.firstCall.args;
			const tokenPayload = JSON.parse(signArgs[2]);

			expect(tokenPayload.context).to.deep.equal(payload);
		});

		it('should generate a JWT with custom audience when provided in options', () => {
			jsrsasignStub.KJUR.jws.IntDate.get.returns(1609459200);
			jsrsasignStub.KJUR.jws.JWS.sign.returns('mocked.jwt.token');

			const payload = { userId: 'user-123' };
			const secret = 'test-secret';
			const customAudience = 'CustomApp';

			generateJWT(payload, secret, { aud: customAudience });

			const signArgs = jsrsasignStub.KJUR.jws.JWS.sign.firstCall.args;
			const tokenPayload = JSON.parse(signArgs[2]);

			expect(tokenPayload.aud).to.equal(customAudience);
		});
	});

	describe('validateAndDecodeJWT', () => {
		it('should return null if jwt is empty', () => {
			const result = validateAndDecodeJWT('', 'secret');
			expect(result).to.be.null;
		});

		it('should return null if jwt is null', () => {
			const result = validateAndDecodeJWT(null as any, 'secret');
			expect(result).to.be.null;
		});

		it('should return null if secret is empty', () => {
			const result = validateAndDecodeJWT('some.jwt.token', '');
			expect(result).to.be.null;
		});

		it('should return null if secret is null', () => {
			const result = validateAndDecodeJWT('some.jwt.token', null as any);
			expect(result).to.be.null;
		});

		it('should return null if signature is invalid', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(false);

			const result = validateAndDecodeJWT('invalid.jwt.token', 'secret');

			expect(result).to.be.null;
			expect(jsrsasignStub.KJUR.jws.JWS.verify.calledOnce).to.be.true;
			expect(jsrsasignStub.KJUR.jws.JWS.verify.calledWith('invalid.jwt.token', 'secret', ['HS256'])).to.be.true;
		});

		it('should return null if token is expired', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
					nbf: Math.floor(Date.now() / 1000) - 7200,
					aud: 'RocketChat',
					context: { userId: 'user-123' },
				},
			});

			const result = validateAndDecodeJWT('expired.jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return null if nbf (not before) is in the future', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) + 7200,
					nbf: Math.floor(Date.now() / 1000) + 3600, // Not valid until 1 hour from now
					aud: 'RocketChat',
					context: { userId: 'user-123' },
				},
			});

			const result = validateAndDecodeJWT('future.jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return null if audience is not RocketChat', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) + 3600,
					nbf: Math.floor(Date.now() / 1000) - 60,
					aud: 'WrongAudience',
					context: { userId: 'user-123' },
				},
			});

			const result = validateAndDecodeJWT('wrong-audience.jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return the context payload for a valid token with correct signature, timestamps, and audience', () => {
			const contextPayload = { userId: 'user-123', fileId: 'file-456', rid: 'room-789' };
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
					nbf: Math.floor(Date.now() / 1000) - 60, // Valid since 1 minute ago
					aud: 'RocketChat',
					context: contextPayload,
				},
			});

			const result = validateAndDecodeJWT('valid.jwt.token', 'secret');

			expect(result).to.deep.equal(contextPayload);
			expect(jsrsasignStub.KJUR.jws.JWS.verify.calledOnce).to.be.true;
			expect(jsrsasignStub.KJUR.jws.JWS.parse.calledOnce).to.be.true;
		});

		it('should return the context payload if exp and nbf are not provided', () => {
			const contextPayload = { userId: 'user-123' };
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					aud: 'RocketChat',
					context: contextPayload,
				},
			});

			const result = validateAndDecodeJWT('valid.jwt.token', 'secret');

			expect(result).to.deep.equal(contextPayload);
		});

		it('should return null if token cannot be parsed', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.throws(new Error('Parse error'));

			const result = validateAndDecodeJWT('malformed.jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return null if verification throws an error', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.throws(new Error('Verification error'));

			const result = validateAndDecodeJWT('error.jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should validate and decode token with custom audience when provided in options', () => {
			const contextPayload = { userId: 'user-123' };
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) + 3600,
					nbf: Math.floor(Date.now() / 1000) - 60,
					aud: 'CustomApp',
					context: contextPayload,
				},
			});

			const result = validateAndDecodeJWT('valid.jwt.token', 'secret', { aud: 'CustomApp' });

			expect(result).to.deep.equal(contextPayload);
		});

		it('should return null if custom audience does not match token audience', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					exp: Math.floor(Date.now() / 1000) + 3600,
					nbf: Math.floor(Date.now() / 1000) - 60,
					aud: 'CustomApp',
					context: { userId: 'user-123' },
				},
			});

			const result = validateAndDecodeJWT('valid.jwt.token', 'secret', { aud: 'DifferentApp' });

			expect(result).to.be.null;
		});

		it('should return null if payloadObj is null', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: null,
			});

			const result = validateAndDecodeJWT('jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return null if context is missing from payload', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns({
				payloadObj: {
					iat: 1609459200,
					nbf: 1609459200,
					exp: 1609462800,
					aud: 'RocketChat',
				},
			});

			const result = validateAndDecodeJWT('jwt.token', 'secret');

			expect(result).to.be.null;
		});

		it('should return null if parse returns undefined', () => {
			jsrsasignStub.KJUR.jws.JWS.verify.returns(true);
			jsrsasignStub.KJUR.jws.JWS.parse.returns(undefined);

			const result = validateAndDecodeJWT('jwt.token', 'secret');

			expect(result).to.be.null;
		});
	});
});
