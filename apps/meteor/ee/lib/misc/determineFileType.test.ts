import { describe, it } from 'node:test';

import { expect } from 'chai';

import { determineFileType } from './determineFileType';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);

describe('determineFileType', () => {
	it('uses the MIME type of the file name when it is known', async () => {
		expect(await determineFileType(pngSignature, 'notes.txt')).to.equal('text/plain');
	});

	it('detects the type from the buffer contents when the name has no known extension', async () => {
		expect(await determineFileType(pngSignature, 'upload')).to.equal('image/png');
	});

	it('falls back to application/octet-stream when neither the name nor the contents identify the type', async () => {
		expect(await determineFileType(Buffer.from('plain bytes'), 'upload')).to.equal('application/octet-stream');
	});
});
