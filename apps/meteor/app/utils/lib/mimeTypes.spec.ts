import { expect } from 'chai';

import { getExtension, getMimeType } from './mimeTypes';

const mimeTypeToExtension = {
	'text/plain': 'txt',
	'image/x-icon': 'ico',
	'image/vnd.microsoft.icon': 'ico',
	'image/png': 'png',
	'image/jpeg': 'jpeg',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'image/bmp': 'bmp',
	'image/tiff': 'tif',
	'audio/wav': 'wav',
	'audio/wave': 'wav',
	'audio/aac': 'aac',
	'audio/x-aac': 'aac',
	'audio/mp4': 'm4a',
	'audio/mpeg': 'mpga',
	'audio/ogg': 'oga',
	'application/octet-stream': 'bin',
};

const extensionToMimeType = {
	lst: 'text/plain',
	txt: 'text/plain',
	ico: 'image/x-icon',
	png: 'image/png',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	bmp: 'image/bmp',
	tiff: 'image/tiff',
	tif: 'image/tiff',
	wav: 'audio/wav',
	aac: 'audio/aac',
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	oga: 'audio/ogg',
	m4a: 'audio/mp4',
	mpga: 'audio/mpeg',
	mp4: 'video/mp4',
	bin: 'application/octet-stream',
};

describe('mimeTypes', () => {
	describe('getExtension', () => {
		for (const [mimeType, extension] of Object.entries(mimeTypeToExtension)) {
			it(`should return the correct extension ${extension} for the given mimeType ${mimeType}`, async () => {
				expect(getExtension(mimeType)).to.be.eql(extension);
			});
		}

		it('should return an empty string if the mimeType is not found', async () => {
			expect(getExtension('application/unknown')).to.be.eql('');
		});
	});

	describe('getMimeType', () => {
		for (const [extension, mimeType] of Object.entries(extensionToMimeType)) {
			it(`should return the correct mimeType ${mimeType} for the given fileName file.${extension} passing the correct mimeType`, async () => {
				expect(getMimeType(mimeType, `file.${extension}`)).to.be.eql(mimeType);
			});
		}

		it('should return the correct mimeType for the given fileName', async () => {
			for (const [extension, mimeType] of Object.entries(extensionToMimeType)) {
				expect(getMimeType('application/unknown', `file.${extension}`)).to.be.eql(mimeType);
			}
		});

		it('should return the correct mimeType for the given fileName when informed mimeType is application/octet-stream', async () => {
			for (const [extension, mimeType] of Object.entries(extensionToMimeType)) {
				expect(getMimeType('application/octet-stream', `file.${extension}`)).to.be.eql(mimeType);
			}
		});

		it('should return the mimeType if it is not application/octet-stream', async () => {
			expect(getMimeType('audio/wav', 'file.wav')).to.be.eql('audio/wav');
		});

		it('should return application/octet-stream if the mimeType is not found', async () => {
			expect(getMimeType('application/octet-stream', 'file.unknown')).to.be.eql('application/octet-stream');
		});
	});
});
