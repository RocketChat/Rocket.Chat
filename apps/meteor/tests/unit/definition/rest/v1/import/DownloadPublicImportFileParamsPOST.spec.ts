import { isDownloadPublicImportFileParamsPOST } from '@rocket.chat/rest-typings';
import { assert } from 'chai';

describe('DownloadPublicImportFileParamsPOST (definition/rest/v1)', () => {
	describe('isDownloadPublicImportFileParamsPOST', () => {
		['https://example.com/import.zip', 'http://10.0.0.1:8080/import.zip', 'HTTPS://example.com/import.zip', 'Http://example.com/x'].forEach(
			(fileUrl) => {
				it(`should accept ${fileUrl}`, () => {
					assert.isTrue(isDownloadPublicImportFileParamsPOST({ fileUrl, importerKey: 'csv' }));
				});
			},
		);

		['/tmp/import.zip', 'file:///tmp/import.zip', 'https://', 'http://:80', 'httpfoo', 'ftp://example.com/import.zip', ''].forEach(
			(fileUrl) => {
				it(`should reject ${JSON.stringify(fileUrl)}`, () => {
					assert.isFalse(isDownloadPublicImportFileParamsPOST({ fileUrl, importerKey: 'csv' }));
				});
			},
		);

		it('should reject a request without importerKey', () => {
			assert.isFalse(isDownloadPublicImportFileParamsPOST({ fileUrl: 'https://example.com/import.zip' }));
		});
	});
});
