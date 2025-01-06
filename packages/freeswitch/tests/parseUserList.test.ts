import { makeFreeSwitchResponse } from './utils/makeFreeSwitchResponse';
import { parseUserList } from '../src/utils/parseUserList';

test.each(['', undefined, 200 as unknown as any, '\nsomething'])('Invalid FreeSwitch responses', (input) => {
	expect(() => parseUserList({ _body: input })).toThrow('Invalid response from FreeSwitch server.');
});

test('Should return an empty list when there is no userid column', () => {
	expect(
		parseUserList(
			makeFreeSwitchResponse([
				['aaa', 'bbb', 'ccc'],
				['AData', 'BData', 'CData'],
				['AData2', 'BData2', 'CData2'],
				['AData3', 'BData3', 'CData3'],
			]),
		),
	).toMatchObject([]);
});

test('Should return an empty list when there is no lowercase userid column', () => {
	expect(
		parseUserList(
			makeFreeSwitchResponse([
				['aaa', 'bbb', 'ccc', 'USERID'],
				[],
				['AData', 'BData', 'CData', '15'],
				['AData2', 'BData2', 'CData2', '20'],
				['AData3', 'BData3', 'CData3', '30'],
			]),
		),
	).toMatchObject([]);
});

test(`Should return an empty list when all records' userid is either missing or equal to +OK`, () => {
	expect(
		parseUserList(
			makeFreeSwitchResponse([
				['aaa', 'bbb', 'ccc', 'userid'],
				['AData', 'BData', 'CData'],
				['AData2', 'BData2', 'CData2', ''],
				['AData3', 'BData3', 'CData3', '+OK'],
			]),
		),
	).toMatchObject([]);
});

test.each([
	[
		[['userid'], ['1']],
		[
			{
				userid: '1',
			},
		],
	],
	[
		[['userid'], ['1'], ['2'], ['3']],
		[
			{
				userid: '1',
			},
			{
				userid: '2',
			},
			{
				userid: '3',
			},
		],
	],
	[
		[
			['userid', 'group', 'name'],
			['1', 'default', 'User 1'],
			['2', 'default', 'User 2'],
			['3', 'default', 'User 3'],
		],
		[
			{
				userid: '1',
				groups: 'default',
				name: 'User 1',
			},
			{
				userid: '2',
				groups: 'default',
				name: 'User 2',
			},
			{
				userid: '3',
				groups: 'default',
				name: 'User 3',
			},
		],
	],
	[
		[
			['userid', 'name'],
			['1', 'User 1', 'AnotherValue'],
			['2', 'User 2'],
			['3', 'User 3'],
		],
		[
			{
				userid: '1',
				name: 'User 1',
				column2: 'AnotherValue',
			},
			{
				userid: '2',
				name: 'User 2',
			},
			{
				userid: '3',
				name: 'User 3',
			},
		],
	],
])('parse valid user list: %p', (input, output) => {
	expect(parseUserList(makeFreeSwitchResponse(input))).toMatchObject(output);
});

test.each([
	[
		[['userid'], ['1'], ['1']],
		[
			{
				userid: '1',
			},
		],
	],
	[
		[['userid'], ['1'], ['2'], ['1'], ['2'], ['3'], ['3']],
		[
			{
				userid: '1',
			},
			{
				userid: '2',
			},
			{
				userid: '3',
			},
		],
	],
	[
		[
			['userid', 'group'],
			['1', 'default'],
			['1', 'employee'],
		],
		[
			{
				userid: '1',
				groups: 'default|employee',
			},
		],
	],
	[
		// When there's multiple records for the same user, join the group names from all of them into the data from the first record
		[
			['userid', 'group'],
			['1', 'default'],
			['2', 'default'],
			['1', 'employee'],
			['2', 'manager'],
			['3', 'default'],
			['3', 'owner'],
		],
		[
			{
				userid: '1',
				groups: 'default|employee',
			},
			{
				userid: '2',
				groups: 'default|manager',
			},
			{
				userid: '3',
				groups: 'default|owner',
			},
		],
	],
	[
		// When there's multiple records for the same user without group names, use only the data from the first of them
		[
			['userid', 'something_else'],
			['1', '1.1'],
			['1', '1.2'],
			['2', '2.1'],
			['2', '2.2', 'extra_value'],
			['3', ''],
			['3', '3.2'],
			['3', '3.3'],
		],
		[
			{
				userid: '1',
				something_else: '1.1',
			},
			{
				userid: '2',
				something_else: '2.1',
			},
			{
				userid: '3',
				something_else: '',
			},
		],
	],
])('parse user list with duplicate userids: %p', (input, output) => {
	expect(parseUserList(makeFreeSwitchResponse(input))).toMatchObject(output);
});
