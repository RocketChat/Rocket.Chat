import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';

const settingValues = new Map<string, string>();

const { fileUploadIsValidContentType } = proxyquire.noCallThru().load('./restrictions', {
	'../../settings': { settings: { get: (settingId: string) => settingValues.get(settingId) } },
});

describe('fileUploadIsValidContentType', () => {
	beforeEach(() => {
		settingValues.set('FileUpload_MediaTypeWhiteList', 'image/*');
		settingValues.set('FileUpload_MediaTypeBlackList', 'image/svg+xml');
	});

	it("should use an integration's own accepted list instead of the global one", () => {
		expect(fileUploadIsValidContentType('application/octet-stream', 'application/octet-stream')).to.be.true;
		expect(fileUploadIsValidContentType('image/png', 'application/octet-stream')).to.be.false;
	});

	it('should keep rejecting globally blocked types when an own accepted list is given', () => {
		settingValues.set('FileUpload_MediaTypeBlackList', 'application/octet-stream');

		expect(fileUploadIsValidContentType('application/octet-stream', 'application/octet-stream')).to.be.false;
	});

	it('should use the global accepted list when no own list is given', () => {
		expect(fileUploadIsValidContentType('image/png')).to.be.true;
		expect(fileUploadIsValidContentType('application/pdf')).to.be.false;
		expect(fileUploadIsValidContentType('image/png', '')).to.be.true;
		expect(fileUploadIsValidContentType('application/pdf', '')).to.be.false;
	});
});
