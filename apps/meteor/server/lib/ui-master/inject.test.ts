import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import type { NextHandleFunction } from 'connect';
import p from 'proxyquire';
import sinon from 'sinon';

const rawModHtml = sinon.stub();
const rawBody = sinon.stub();
const connectHandlersUse = sinon.stub();

const loadInject = () =>
	p
		.noCallThru()
		.noPreserveCache()
		.load('./inject.ts', {
			'meteor/meteorhacks:inject-initial': { Inject: { rawModHtml, rawBody } },
			'meteor/webapp': { WebApp: { connectHandlers: { use: connectHandlersUse } } },
			'../utils/getURL': { getURL: (path: string) => `/${path}` },
		});

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

const headHtml = (call = rawModHtml.lastCall) => {
	expect(call.args[0]).to.equal('headInjections');
	return call.args[1]('<html><head></head><body></body></html>');
};

describe('ui-master inject', () => {
	let inject: ReturnType<typeof loadInject>;

	beforeEach(() => {
		rawModHtml.reset();
		rawBody.reset();
		connectHandlersUse.reset();
		inject = loadInject();
	});

	describe('injectIntoHead', () => {
		it('should render the head once for all injections made in the same tick', async () => {
			inject.injectIntoHead('a', '<meta name="a">');
			inject.injectIntoHead('b', '<meta name="b">');
			inject.injectIntoHead('a', '<meta name="a2">');

			expect(rawModHtml.callCount).to.equal(0);

			await nextTick();

			expect(rawModHtml.callCount).to.equal(1);
			expect(headHtml()).to.equal('<html><head><meta name="a2">\n<meta name="b">\n</head><body></body></html>');
		});

		it('should not render again when a key is set to the value it already has', async () => {
			inject.injectIntoHead('a', '<meta name="a">');
			await nextTick();
			rawModHtml.resetHistory();

			inject.injectIntoHead('a', '<meta name="a">');
			await nextTick();

			expect(rawModHtml.callCount).to.equal(0);
		});

		it('should keep the first insertion order when a key changes in a later tick', async () => {
			inject.injectIntoHead('a', '<meta name="a">');
			inject.injectIntoHead('b', '<meta name="b">');
			await nextTick();

			inject.injectIntoHead('a', '<meta name="a2">');
			await nextTick();

			expect(rawModHtml.callCount).to.equal(2);
			expect(headHtml()).to.equal('<html><head><meta name="a2">\n<meta name="b">\n</head><body></body></html>');
		});

		it('should leave out keys set to an empty string', async () => {
			inject.injectIntoHead('a', '<meta name="a">');
			inject.injectIntoHead('empty', '');
			await nextTick();

			expect(headHtml()).to.equal('<html><head><meta name="a">\n</head><body></body></html>');
		});
	});

	describe('addStyle', () => {
		it('should link the stylesheet in the head and serve its content at the hashed path', async () => {
			inject.addStyle('theme', 'body { color: red; }');
			await nextTick();

			const html = headHtml();
			const href = html.match(/href="([^"]+)"/)?.[1];
			expect(href).to.match(/^\/theme_[0-9a-f]{40}\.css$/);

			const handler: NextHandleFunction = connectHandlersUse.firstCall.args[0];
			const res = { writeHead: sinon.stub(), write: sinon.stub(), end: sinon.stub() };
			const next = sinon.stub();
			handler({ method: 'GET', url: href } as any, res as any, next);

			expect(next.callCount).to.equal(0);
			expect(res.writeHead.firstCall.args[1]).to.include({ 'Content-type': 'text/css; charset=UTF-8' });
			expect(res.write.args).to.deep.equal([['body { color: red; }']]);
		});
	});

	describe('applyHeadInjections', () => {
		it('should return the html unchanged when there are no injections', () => {
			expect(inject.applyHeadInjections([])('<head></head>')).to.equal('<head></head>');
		});

		it('should insert strings and the tags of non-empty assets before </head>', () => {
			const apply = inject.applyHeadInjections([
				'<title>$1 & $$</title>',
				{ type: 'JS', tag: '<script src="/a.js"></script>', content: 'alert(1)' },
				{ type: 'CSS', tag: '<link href="/b.css">', content: '  ' },
			]);

			expect(apply('<head></head>')).to.equal('<head><title>$1 & $$</title>\n<script src="/a.js"></script>\n\n</head>');
		});
	});
});
