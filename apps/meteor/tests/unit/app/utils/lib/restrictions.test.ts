import { describe, it } from 'node:test';

import { expect } from 'chai';

import { fileUploadIsValidContentTypeFromSettings } from '../../../../../app/utils/lib/restrictions';

describe('fileUploadIsValidContentTypeFromSettings', () => {
	describe('no lists configured', () => {
		it('should accept any type, known or not', () => {
			expect(fileUploadIsValidContentTypeFromSettings('image/jpeg', '', '')).to.be.true;
			expect(fileUploadIsValidContentTypeFromSettings(undefined, '', '')).to.be.true;
		});
	});

	describe('allowlist', () => {
		it('should accept a type matching any entry, ignoring surrounding whitespace', () => {
			const whiteList = ' image/png , application/pdf ,text/* ';

			expect(fileUploadIsValidContentTypeFromSettings('application/pdf', whiteList, '')).to.be.true;
			expect(fileUploadIsValidContentTypeFromSettings('text/csv', whiteList, '')).to.be.true;
			expect(fileUploadIsValidContentTypeFromSettings('image/gif', whiteList, '')).to.be.false;
		});

		it('should reject an unknown type', () => {
			expect(fileUploadIsValidContentTypeFromSettings(undefined, 'image/jpeg', '')).to.be.false;
		});
	});

	describe('unrestricted allowlist', () => {
		it('should accept any type, known or not, when the allowlist is "*"', () => {
			expect(fileUploadIsValidContentTypeFromSettings('application/pdf', '*', '')).to.be.true;
			expect(fileUploadIsValidContentTypeFromSettings(undefined, '*', '')).to.be.true;
		});

		it('should still reject blocked types when the allowlist is "*"', () => {
			expect(fileUploadIsValidContentTypeFromSettings('image/svg+xml', '*', 'image/svg+xml')).to.be.false;
			expect(fileUploadIsValidContentTypeFromSettings('image/png', '*', 'image/svg+xml')).to.be.true;
		});
	});

	describe('blocklist', () => {
		it('should reject a type matching any entry, ignoring surrounding whitespace', () => {
			const blackList = 'image/svg+xml, application/zip , video/*';

			expect(fileUploadIsValidContentTypeFromSettings('application/zip', '', blackList)).to.be.false;
			expect(fileUploadIsValidContentTypeFromSettings('video/mp4', '', blackList)).to.be.false;
			expect(fileUploadIsValidContentTypeFromSettings('image/png', '', blackList)).to.be.true;
		});
	});

	describe('blocklist priority', () => {
		it('should reject a blocked type even when the allowlist accepts it', () => {
			expect(fileUploadIsValidContentTypeFromSettings('image/png', 'image/png', 'image/png')).to.be.false;
			expect(fileUploadIsValidContentTypeFromSettings('image/png', 'image/png', 'image/*')).to.be.false;
			expect(fileUploadIsValidContentTypeFromSettings('image/png', 'image/*', 'image/png')).to.be.false;
		});

		it('should let the allowlist decide when the blocklist does not match', () => {
			expect(fileUploadIsValidContentTypeFromSettings('image/png', 'image/png', 'video/*')).to.be.true;
			expect(fileUploadIsValidContentTypeFromSettings('application/pdf', 'image/png', 'video/*')).to.be.false;
		});
	});
});
