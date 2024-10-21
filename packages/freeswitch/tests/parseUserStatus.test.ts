import { parseUserStatus } from '../src/utils/parseUserStatus';

test.each([
	['', 'UNKNOWN'],
	[undefined, 'UNKNOWN'],
	['error/user_not_registered', 'UNREGISTERED'],
	['ERROR/user_not_registered', 'UNKNOWN'],
	['sofia/user_data', 'REGISTERED'],
	['sofia/', 'REGISTERED'],
	['SOFIA/', 'UNKNOWN'],
	['luana/', 'UNKNOWN'],
])('parse user status: %p', (input, output) => {
	expect(parseUserStatus(input)).toBe(output);
});
