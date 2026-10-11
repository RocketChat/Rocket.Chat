import type { Request } from 'express';

import { Strategy } from './Strategy';

const defaultOptions = {
	consumerKey: 'ABC123',
	consumerSecret: 'secret',
	callbackURL: 'http://www.example.test/callback',
};

function noop() {
	// verify callback placeholder
}

describe('Strategy', () => {
	describe('constructed', () => {
		const strategy = new Strategy(defaultOptions, noop);

		it('should be named twitter', () => {
			expect(strategy.name).toBe('twitter');
		});
	});

	describe('constructed with undefined options', () => {
		it('should throw', () => {
			expect(() => {
				// @ts-expect-error testing invalid input
				new Strategy(undefined, noop);
			}).toThrow();
		});
	});

	describe('failure caused by user denying request', () => {
		it('should call fail()', () => {
			const strategy = new Strategy(defaultOptions, noop);
			strategy.fail = jest.fn();

			const req = { query: { denied: '8L74Y149' } } as unknown as Request;
			strategy.authenticate(req);

			expect(strategy.fail).toHaveBeenCalled();
		});
	});

	describe('userAuthorizationParams', () => {
		const strategy = new Strategy(defaultOptions, noop);

		it('should return empty object when no options', () => {
			expect(strategy.userAuthorizationParams({})).toEqual({});
		});

		it('should map forceLogin to force_login', () => {
			const params = strategy.userAuthorizationParams({ forceLogin: true });
			expect(params).toEqual({ force_login: true });
		});

		it('should map screenName to screen_name', () => {
			const params = strategy.userAuthorizationParams({ screenName: 'bob' });
			expect(params).toEqual({ screen_name: 'bob' });
		});

		it('should map both options', () => {
			const params = strategy.userAuthorizationParams({ forceLogin: true, screenName: 'bob' });
			expect(params).toEqual({ force_login: true, screen_name: 'bob' });
		});
	});

	describe('parseErrorResponse', () => {
		const strategy = new Strategy(defaultOptions, noop);

		it('should parse JSON error response', () => {
			const body = '{"errors":[{"code":32,"message":"Could not authenticate you."}]}';
			const err = strategy.parseErrorResponse(body, 401);
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe('Could not authenticate you.');
		});

		it('should parse XML error response', () => {
			const body =
				'<?xml version="1.0" encoding="UTF-8"?>\n<hash>\n  <error>This client application\'s callback url has been locked</error>\n  <request>/oauth/request_token</request>\n</hash>\n';
			const err = strategy.parseErrorResponse(body, 401);
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe("This client application's callback url has been locked");
		});

		it('should return plain text as error when body is not JSON or XML', () => {
			const body = 'Invalid request token.';
			const err = strategy.parseErrorResponse(body, 401);
			expect(err).toBeInstanceOf(Error);
			expect(err?.message).toBe('Invalid request token.');
		});

		it('should return undefined for JSON without errors array', () => {
			const body = '{"foo":"bar"}';
			const err = strategy.parseErrorResponse(body, 401);
			expect(err).toBeUndefined();
		});
	});
});
