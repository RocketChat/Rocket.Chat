import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const readPrivateAssetText = sinon.stub();

const { getMomentLocale } = proxyquire.noCallThru().load('./getMomentLocale', {
	'./privateAssets': { readPrivateAssetText },
});

describe('getMomentLocale', () => {
	beforeEach(() => {
		readPrivateAssetText.reset();
	});

	it('should read the lowercased locale file', async () => {
		readPrivateAssetText.withArgs('moment-locales/pt-br.js').resolves('pt-br locale');

		expect(await getMomentLocale('pt-BR')).to.equal('pt-br locale');
	});

	it('should fall back to the base language', async () => {
		readPrivateAssetText.rejects(new Error('ENOENT'));
		readPrivateAssetText.withArgs('moment-locales/de.js').resolves('de locale');

		expect(await getMomentLocale('de-IN')).to.equal('de locale');
	});

	it('should fall back to the base language of a tag with script and region subtags', async () => {
		readPrivateAssetText.rejects(new Error('ENOENT'));
		readPrivateAssetText.withArgs('moment-locales/de.js').resolves('de locale');

		expect(await getMomentLocale('de-Latn-DE')).to.equal('de locale');
	});

	it('should fall back to the mapped moment locale', async () => {
		readPrivateAssetText.rejects(new Error('ENOENT'));
		readPrivateAssetText.withArgs('moment-locales/zh-cn.js').resolves('zh-cn locale');

		expect(await getMomentLocale('zh')).to.equal('zh-cn locale');
	});

	it('should reject when no locale file exists', async () => {
		readPrivateAssetText.rejects(new Error('ENOENT'));

		await expect(getMomentLocale('xx')).to.be.rejectedWith('Moment locale not found: xx');
	});

	// The locale ends up in a file path, so anything but a language tag must not reach the file system.
	it('should reject a locale that is not a language tag without reading any file', async () => {
		for (const locale of ['../../../../main', 'pt/../../x', 'en\0', 'e', 'en-', 'en-toolongsubtag', '']) {
			await expect(getMomentLocale(locale)).to.be.rejectedWith('Moment locale not found');
		}

		expect(readPrivateAssetText.called).to.equal(false);
	});
});
