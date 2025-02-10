import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useValidatePassword } from './useValidatePassword';

const settingsMockWrapper = mockAppRoot()
	.withSetting('Accounts_Password_Policy_Enabled', 'true')
	.withSetting('Accounts_Password_Policy_MinLength', '6')
	.withSetting('Accounts_Password_Policy_MaxLength', '24')
	.withSetting('Accounts_Password_Policy_ForbidRepeatingCharacters', 'true')
	.withSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount', '3')
	.withSetting('Accounts_Password_Policy_AtLeastOneLowercase', 'true')
	.withSetting('Accounts_Password_Policy_AtLeastOneUppercase', 'true')
	.withSetting('Accounts_Password_Policy_AtLeastOneNumber', 'true')
	.withSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter', 'true')
	.build();

it("should return `false` if password doesn't match all the requirements", async () => {
	const { result } = renderHook(async () => useValidatePassword('secret'), {
		wrapper: settingsMockWrapper,
	});

	const res = await result.current;
	expect(res).toBeFalsy();
});

it('should return `true` if password matches all the requirements', async () => {
	const { result } = renderHook(async () => useValidatePassword('5kgnGPq^&t4DSYW!SH#4N'), {
		wrapper: settingsMockWrapper,
	});

	const res = await result.current;
	expect(res).toBeTruthy();
});
