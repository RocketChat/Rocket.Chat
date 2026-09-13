import { faker } from '@faker-js/faker';

import { getNodeIconType } from './getNodeIconType';

it('should return clip icon if file does not have mime type', () => {
	expect(getNodeIconType(faker.system.fileName(), faker.system.fileType(), undefined)).toBe('clip');
});

it('should return folder icon if file type is directory', () => {
	expect(getNodeIconType(faker.system.fileName(), 'directory', undefined)).toBe('folder');
});

it('should return file-pdf icon for PDF mime type', () => {
	expect(getNodeIconType('report.pdf', 'file', 'application/pdf')).toBe('file-pdf');
});
