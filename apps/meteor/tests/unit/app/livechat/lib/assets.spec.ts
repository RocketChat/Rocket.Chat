import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';

import { addServerUrlToIndex } from '../../../../../app/livechat/lib/Assets';

describe('addServerUrlToIndex', () => {
	before(() => {
		(global as any).__meteor_runtime_config__ = { ROOT_URL: 'http://localhost:3000' };
	});
	after(() => {
		delete (global as any).__meteor_runtime_config__;
	});

	it('should do nothing if "file" has no <body> tag', () => {
		const file = addServerUrlToIndex('file');
		expect(file).to.equal('file');
	});
	it('should replace <body> with an script tag containing the SERVER_URL inside', () => {
		const file = addServerUrlToIndex('<html><body></body></html>');
		expect(file).to.equal("<html><body><script> SERVER_URL = 'http://localhost:3000'; </script></body></html>");
	});
	it('should remove any trailing / from the SERVER_URL', () => {
		(global as any).__meteor_runtime_config__ = { ROOT_URL: 'http://localhost:3000/' };
		const file = addServerUrlToIndex('<html><body></body></html>');
		expect(file).to.equal("<html><body><script> SERVER_URL = 'http://localhost:3000'; </script></body></html>");
	});
	it('should use the value from the global variable always', () => {
		const file = addServerUrlToIndex('<html><body></body></html>');
		expect(file).to.equal("<html><body><script> SERVER_URL = 'http://localhost:3000'; </script></body></html>");

		(global as any).__meteor_runtime_config__ = { ROOT_URL: 'http://kodiak.rocket.chat/' };
		const file2 = addServerUrlToIndex('<html><body></body></html>');
		expect(file2).to.equal("<html><body><script> SERVER_URL = 'http://kodiak.rocket.chat'; </script></body></html>");
	});
});
