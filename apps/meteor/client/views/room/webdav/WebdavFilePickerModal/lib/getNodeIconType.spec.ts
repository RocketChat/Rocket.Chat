import { faker } from '@faker-js/faker';

import { getNodeIconType } from './getNodeIconType';

it('should return clip icon if file does not have mime type', () => {
	const result = getNodeIconType(faker.system.fileName(), faker.system.fileType(), undefined);
	expect(result.icon).toBe('clip');
});

it('should return folder icon if file type is directory', () => {
	const result = getNodeIconType(faker.system.fileName(), 'directory', undefined);
	expect(result.icon).toBe('folder');
});
