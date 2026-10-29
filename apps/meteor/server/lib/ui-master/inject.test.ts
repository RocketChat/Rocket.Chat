import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class ReactiveDict {
	private values = new Map<string, unknown>();

	get(key: string) {
		return this.values.get(key);
	}

	set(key: string, value: unknown) {
		this.values.set(key, value);
	}
}

const connectHandlersUse = sinon.stub();

const { addScript, addStyle } = proxyquire.noCallThru().load('./inject', {
	'meteor/meteorhacks:inject-initial': { Inject: { rawBody: sinon.stub() } },
	'meteor/reactive-dict': { ReactiveDict },
	'meteor/webapp': { WebApp: { connectHandlers: { use: connectHandlersUse } } },
	'../utils/getURL': { getURL: (path: string) => `/${path}` },
});

const handler = connectHandlersUse.firstCall.args[0];

const request = (url: string) => {
	const res = {
		writeHead: sinon.stub(),
		write: sinon.stub(),
		end: sinon.stub(),
	};
	const next = sinon.stub();

	handler({ method: 'GET', url }, res, next);

	return { res, next };
};

describe('ui-master inject', () => {
	it('should serve injected CSS with a Content-Length equal to its UTF-8 byte length', () => {
		const content = '/* zażółć gęślą jaźń ✓ 🚀 */\nbody { outline: 3px solid red; }';
		addStyle('css-theme', content);

		const { res, next } = request('/css-theme_hash.css');

		expect(next.called).to.be.false;
		expect(res.writeHead.firstCall.args[1]).to.include({
			'Content-type': 'text/css; charset=UTF-8',
			'Content-Length': Buffer.from(content, 'utf8').length,
		});
		expect(res.write.calledOnceWith(content)).to.be.true;
		expect(res.end.calledOnce).to.be.true;
	});

	it('should serve injected JS with a Content-Length equal to its UTF-8 byte length', () => {
		const content = 'console.log("héllo wörld ✓");';
		addScript('custom-script', content);

		const { res } = request('/custom-script_hash.js');

		expect(res.writeHead.firstCall.args[1]).to.include({
			'Content-type': 'application/javascript; charset=UTF-8',
			'Content-Length': Buffer.from(content, 'utf8').length,
		});
		expect(res.write.calledOnceWith(content)).to.be.true;
	});

	it('should serve ASCII-only content with a Content-Length equal to its length', () => {
		const content = 'body { color: red; }';
		addStyle('ascii', content);

		const { res } = request('/ascii_hash.css');

		expect(res.writeHead.firstCall.args[1]).to.include({ 'Content-Length': content.length });
	});

	it('should pass the request on when nothing is injected for the path', () => {
		const { res, next } = request('/unknown_hash.css');

		expect(next.calledOnce).to.be.true;
		expect(res.writeHead.called).to.be.false;
	});
});
