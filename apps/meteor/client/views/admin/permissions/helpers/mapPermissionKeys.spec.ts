import { filterPermissionKeys, mapPermissionKeys } from './mapPermissionKeys';

describe('mapPermissionKeys', () => {
	it('should return an empty array if there are no permissions', () => {
		const t: any = (string: string) => string;

		const result = mapPermissionKeys({ t, permissions: [] });

		expect(result).toEqual([]);
	});

	it('should map the permissions and return an array of objects with _id and i18nLabels', () => {
		const t: any = (string: string) => string;

		const result = mapPermissionKeys({
			t,
			permissions: [
				{
					_id: 'delete-team',
					roles: ['admin'],
					_updatedAt: new Date(),
				},
				{
					_id: 'delete-user',
					roles: ['admin'],
					_updatedAt: new Date(),
				},
				{
					_id: 'delete-channel',
					roles: ['admin'],
					_updatedAt: new Date(),
				},
			],
		});

		expect(result).toEqual([
			{
				_id: 'delete-team',
				i18nLabels: ['delete-team'],
			},
			{
				_id: 'delete-user',
				i18nLabels: ['delete-user'],
			},
			{
				_id: 'delete-channel',
				i18nLabels: ['delete-channel'],
			},
		]);
	});
});

describe('filterPermissionKeys', () => {
	it('should return an empty array if there are no permissions', () => {
		const result = filterPermissionKeys([], '');

		expect(result).toEqual([]);
	});

	it('should filter the permissions and return an array ids that match with the filter text', () => {
		const result = filterPermissionKeys(permissionKeys, 'delete');
		expect(result).toEqual(['delete-team', 'delete-user', 'delete-channel']);
	});

	it('should match case insensitive and in any order', () => {
		const result = filterPermissionKeys(permissionKeys, 'team DELETE');
		expect(result).toEqual(['delete-team']);
	});

	it('should return an empty array if there are no matches with the filter text', () => {
		const result = filterPermissionKeys(permissionKeys, 'mailer');
		expect(result).toEqual([]);
	});
});

const permissionKeys = [
	{
		_id: 'delete-team',
		i18nLabels: ['delete-team', 'Delete team'],
	},
	{
		_id: 'delete-user',
		i18nLabels: ['delete-user', 'Delete user'],
	},
	{
		_id: 'delete-channel',
		i18nLabels: ['delete-channel', 'Delete channel'],
	},
];
