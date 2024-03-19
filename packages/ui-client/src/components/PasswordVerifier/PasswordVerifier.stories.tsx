import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { PasswordVerifier } from './PasswordVerifier';

export default {
	title: 'Components/PasswordVerifier',
	component: PasswordVerifier,
	decorators: [
		mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '12')
			.withSetting('Accounts_Password_Policy_MaxLength', '24')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharacters', 'true')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount', '3')
			.withSetting('Accounts_Password_Policy_AtLeastOneLowercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneUppercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneNumber', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter', 'true')
			.withSetting('Language', 'en')
			.withTranslations('en', 'core', { Password_must_have: 'Password must have:' })
			.withTranslations('en', 'core', { 'get-password-policy-minLength-label': 'At least {{limit}} characters' })
			.withTranslations('en', 'core', { 'get-password-policy-maxLength-label': 'At most {{limit}} characters' })
			.withTranslations('en', 'core', {
				'get-password-policy-forbidRepeatingCharactersCount-label': 'Max. {{limit}} repeating characters',
			})
			.withTranslations('en', 'core', {
				'get-password-policy-mustContainAtLeastOneLowercase-label': 'At least one lowercase letter',
			})
			.withTranslations('en', 'core', {
				'get-password-policy-mustContainAtLeastOneUppercase-label': 'At least one uppercase letter',
			})
			.withTranslations('en', 'core', { 'get-password-policy-mustContainAtLeastOneNumber-label': 'At least one number' })
			.withTranslations('en', 'core', {
				'get-password-policy-mustContainAtLeastOneSpecialCharacter-label': 'At least one symbol',
			})
			.buildStoryDecorator(),
	],
	args: {
		password: '123',
	},
} as ComponentMeta<typeof PasswordVerifier>;

export const Default: ComponentStory<typeof PasswordVerifier> = (args) => <PasswordVerifier {...args} />;
