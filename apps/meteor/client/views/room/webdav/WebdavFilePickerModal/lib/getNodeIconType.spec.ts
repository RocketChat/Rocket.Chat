import { faker } from '@faker-js/faker';

import { getNodeIconType } from './getNodeIconType';

it('should return clip icon if file does not have mime type', () => {
	const result = getNodeIconType(faker.system.fileName(), faker.system.fileType(), undefined);
	expect(result).toBe('clip');
});

it('should return folder icon if file type is directory', () => {
	const result = getNodeIconType(faker.system.fileName(), 'directory', undefined);
	expect(result).toBe('folder');
});

it('should return file-pdf icon for PDF mime type', () => {
	const result = getNodeIconType('document.pdf', 'file', 'application/pdf');
	expect(result).toBe('file-pdf');
});

it('should return file-document icon for OpenDocument text', () => {
	const result = getNodeIconType('doc.odt', 'file', 'application/vnd.oasis.opendocument.text');
	expect(result).toBe('file-document');
});

it('should return file-sheets icon for Excel files', () => {
	const result = getNodeIconType('sheet.xlsx', 'file', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	expect(result).toBe('file-sheets');
});

it('should return file-sheets icon for PowerPoint files', () => {
	const result = getNodeIconType('presentation.ppt', 'file', 'application/vnd.ms-powerpoint');
	expect(result).toBe('file-sheets');
});
