import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { PasswordVerifier } from './PasswordVerifier';

export default {
	title: 'Components/PasswordVerifier',
	component: PasswordVerifier,
	decorators: [
		mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '6')
			.withSetting('Accounts_Password_Policy_MaxLength', '24')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharacters', 'true')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount', '3')
			.withSetting('Accounts_Password_Policy_AtLeastOneLowercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneUppercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneNumber', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter', 'true')
			.buildStoryDecorator(),
	],
	args: {
		password: '123',
	},
} as ComponentMeta<typeof PasswordVerifier>;

export const Default: ComponentStory<typeof PasswordVerifier> = (args) => <PasswordVerifier {...args} />;
