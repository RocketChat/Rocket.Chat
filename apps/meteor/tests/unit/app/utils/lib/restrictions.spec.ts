import { expect } from 'chai';

import { fileUploadIsValidContentTypeFromSettings } from '../../../../../app/utils/lib/restrictions';

describe('fileUploadIsValidContentTypeFromSettings', () => {
	it('should return true if type is not defined and whiteList is not defined', () => {
		expect(fileUploadIsValidContentTypeFromSettings(undefined, '', '')).to.be.true;
	});

	it('should return false if type is not defined and whiteList is defined', () => {
		expect(fileUploadIsValidContentTypeFromSettings(undefined, 'image/jpeg', '')).to.be.false;
	});

	it('should return true if type is defined and whiteList is not defined', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', '', '')).to.be.true;
	});

	it('should return true if type is defined and whiteList is defined and type is in whiteList', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', 'image/jpeg', '')).to.be.true;
	});

	it('should return false if type is defined and whiteList is defined and type is not in whiteList', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/png', 'image/jpeg', '')).to.be.false;
	});

	it('should return false if type is defined and whiteList is not defined and type is in blackList', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', '', 'image/jpeg')).to.be.false;
	});

	it('should return true if type is defined and whiteList is not defined and type is not in blackList', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/png', '', 'image/jpeg')).to.be.true;
	});

	it('should return true if type is defined and whiteList is defined and type is in whiteList with wildcard', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', 'image/*', '')).to.be.true;
	});

	it('should return false if type is defined and whiteList is defined and type is not in whiteList with wildcard', () => {
		expect(fileUploadIsValidContentTypeFromSettings('text/plain', 'image/*', '')).to.be.false;
	});

	it('should return false if type is defined and whiteList is not defined and type is in blackList with wildcard', () => {
		expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', '', 'image/*')).to.be.false;
	});

	it('should return true if type is defined and whiteList is defined and type is not in blackList with wildcard', () => {
		expect(fileUploadIsValidContentTypeFromSettings('text/plain', '', 'image/*')).to.be.true;
	});
});
