import { mapUserData } from '../src/utils/mapUserData';

expect(() => mapUserData(undefined as unknown as any)).toThrow();
expect(() => mapUserData({ extension: '15' })).toThrow('Invalid user identification.');

test.each([
	[{ userid: '1' }, { extension: '1', groups: [], status: 'UNKNOWN' }],
	[
		{ userid: '1', context: 'default' },
		{ extension: '1', context: 'default', groups: [], status: 'UNKNOWN' },
	],
	[
		{
			userid: '1',
			context: 'default',
			domain: 'domainName',
			groups: 'default|employee',
			contact: 'no',
			callgroup: 'call group',
			effective_caller_id_name: 'caller_id_name',
			effective_caller_id_number: 'caller_id_number',
		},
		{
			extension: '1',
			context: 'default',
			domain: 'domainName',
			groups: ['default', 'employee'],
			contact: 'no',
			callGroup: 'call group',
			callerName: 'caller_id_name',
			callerNumber: 'caller_id_number',
			status: 'UNKNOWN',
		},
	],
])('parse user status: %p', (input, output) => {
	expect(mapUserData(input)).toMatchObject(output);
});
