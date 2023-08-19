import { mockAppRoot } from '@rocket.chat/mock-providers';
import { type ComponentStory, type ComponentMeta } from '@storybook/react';

import LoginSwitchLanguageFooter from './LoginSwitchLanguageFooter';

export default {
	title: 'components/LoginSwitchLanguageFooter',
	component: LoginSwitchLanguageFooter,
	decorators: [
		mockAppRoot()
			.withSetting('Language', 'fi')
			.withTranslations('en', 'registration', { 'component.switchLanguage': 'Change to {{ name }}' })
			.withTranslations('fi', 'registration', { 'component.switchLanguage': 'Vaihda kieleksi {{ name }}' })
			.buildStoryDecorator(),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof LoginSwitchLanguageFooter>;

export const Default: ComponentStory<typeof LoginSwitchLanguageFooter> = () => <LoginSwitchLanguageFooter />;
