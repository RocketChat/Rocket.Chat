import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IHttpPreRequestHandler, IHttpPreResponseHandler } from '../../../../src/definition/accessors';
import { HttpExtend } from '../../../../src/server/accessors';

describe('HttpExtend', () => {
	it('basicHttpExtend', () => {
		assert.doesNotThrow(() => new HttpExtend());

		const he = new HttpExtend();
		assert.deepStrictEqual(he.getDefaultHeaders(), new Map());
		assert.deepStrictEqual(he.getDefaultParams(), new Map());
		assert.strictEqual(he.getPreRequestHandlers().length, 0);
		assert.strictEqual(he.getPreResponseHandlers().length, 0);
	});

	it('defaultHeadersInHttpExtend', () => {
		const he = new HttpExtend();

		assert.doesNotThrow(() => he.provideDefaultHeader('Auth', 'token'));
		assert.strictEqual(he.getDefaultHeaders().size, 1);
		assert.strictEqual(he.getDefaultHeaders().get('Auth'), 'token');

		assert.doesNotThrow(() =>
			he.provideDefaultHeaders({
				Auth: 'token2',
				Another: 'thing',
			}),
		);
		assert.strictEqual(he.getDefaultHeaders().size, 2);
		assert.strictEqual(he.getDefaultHeaders().get('Auth'), 'token2');
		assert.strictEqual(he.getDefaultHeaders().get('Another'), 'thing');
	});

	it('defaultParamsInHttpExtend', () => {
		const he = new HttpExtend();

		assert.doesNotThrow(() => he.provideDefaultParam('id', 'abcdefg'));
		assert.strictEqual(he.getDefaultParams().size, 1);
		assert.strictEqual(he.getDefaultParams().get('id'), 'abcdefg');

		assert.doesNotThrow(() =>
			he.provideDefaultParams({
				id: 'zyxwvu',
				count: '4',
			}),
		);
		assert.strictEqual(he.getDefaultParams().size, 2);
		assert.strictEqual(he.getDefaultParams().get('id'), 'zyxwvu');
		assert.strictEqual(he.getDefaultParams().get('count'), '4');
	});

	it('preRequestHandlersInHttpExtend', () => {
		const he = new HttpExtend();

		const preRequestHandler: IHttpPreRequestHandler = {
			executePreHttpRequest: function _thing(url, req) {
				return new Promise((resolve) => resolve(req));
			},
		};

		assert.doesNotThrow(() => he.providePreRequestHandler(preRequestHandler));
		assert.ok(he.getPreRequestHandlers().length > 0);
	});

	it('preResponseHandlersInHttpExtend', () => {
		const he = new HttpExtend();

		const preResponseHandler: IHttpPreResponseHandler = {
			executePreHttpResponse: function _thing(res) {
				return new Promise((resolve) => resolve(res));
			},
		};

		assert.doesNotThrow(() => he.providePreResponseHandler(preResponseHandler));
		assert.ok(he.getPreResponseHandlers().length > 0);
	});
});
