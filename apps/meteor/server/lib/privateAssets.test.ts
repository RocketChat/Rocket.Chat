import path from 'node:path';
import { describe, it } from 'node:test';

import { expect } from 'chai';

import { resolvePrivateAsset } from './privateAssets';

const root = path.join(process.cwd(), 'assets', 'app');

describe('resolvePrivateAsset', () => {
	it('should resolve a path under the private assets root', () => {
		expect(resolvePrivateAsset('avatars/rocketcat.png')).to.equal(path.join(root, 'avatars', 'rocketcat.png'));
		expect(resolvePrivateAsset('moment-locales/../avatars/rocketcat.png')).to.equal(path.join(root, 'avatars', 'rocketcat.png'));
	});

	it('should reject a path that leads outside the private assets root', () => {
		expect(() => resolvePrivateAsset('../program.json')).to.throw();
		expect(() => resolvePrivateAsset('moment-locales/../../../../main.js')).to.throw();
		expect(() => resolvePrivateAsset('/etc/passwd')).to.throw();
	});

	// A sibling directory whose name starts with the root's name is still outside it.
	it('should reject a sibling directory sharing the root name as a prefix', () => {
		expect(() => resolvePrivateAsset('../app-other/file')).to.throw();
	});

	it('should reject the root itself', () => {
		expect(() => resolvePrivateAsset('')).to.throw();
		expect(() => resolvePrivateAsset('.')).to.throw();
	});
});
