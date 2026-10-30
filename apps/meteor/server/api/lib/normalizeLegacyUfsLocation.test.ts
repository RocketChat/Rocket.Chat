import { describe, it } from 'node:test';

import { expect } from 'chai';

import { normalizeLegacyUfsLocation } from './normalizeLegacyUfsLocation';

describe('normalizeLegacyUfsLocation', () => {
	it('should rewrite a legacy /ufs path and url to the /file-upload route', () => {
		const result = normalizeLegacyUfsLocation({
			_id: 'abc',
			name: 'my image.png',
			path: '/ufs/GridFS:Uploads/abc/my%20image.png',
			url: 'https://chat.example.com/ufs/GridFS:Uploads/abc/my%20image.png',
		});

		expect(result.path).to.equal('/file-upload/abc/my%20image.png');
		expect(result.url).to.equal('https://chat.example.com/file-upload/abc/my%20image.png');
	});

	it('should keep the site sub-path in the url', () => {
		const result = normalizeLegacyUfsLocation({
			_id: 'abc',
			name: 'a.png',
			path: '/ufs/GridFS:Uploads/abc/a.png',
			url: 'https://example.com/chat/ufs/GridFS:Uploads/abc/a.png',
		});

		expect(result.url).to.equal('https://example.com/chat/file-upload/abc/a.png');
	});

	it('should return rows already on the /file-upload route unchanged', () => {
		const file = { _id: 'abc', name: 'a.png', path: '/file-upload/abc/a.png', url: 'https://example.com/file-upload/abc/a.png' };

		expect(normalizeLegacyUfsLocation(file)).to.equal(file);
	});

	it('should leave stores other than Uploads unchanged', () => {
		const file = {
			_id: 'abc',
			name: 'a.png',
			path: '/ufs/GridFS:Avatars/abc/a.png',
			url: 'https://example.com/ufs/GridFS:Avatars/abc/a.png',
		};

		expect(normalizeLegacyUfsLocation(file)).to.equal(file);
	});

	it('should accept rows without path or url', () => {
		const file = { _id: 'abc', name: 'a.png' };

		expect(normalizeLegacyUfsLocation(file)).to.equal(file);
	});
});
