import { mockAppRoot } from '@rocket.chat/mock-providers';
import { type ComponentStory, type ComponentMeta } from '@storybook/react';

import LoginSwitchLanguageFooter from './LoginSwitchLanguageFooter';

export default {
	title: 'components/LoginSwitchLanguageFooter',
	component: LoginSwitchLanguageFooter,
	decorators: [
		mockAppRoot()
			.withSetting('Language', 'fi')
			.withTranslations('en', 'registration', { 'component.switchLanguage': 'Change to <1>{{ name }}</1>' })
			.withTranslations('fi', 'registration', { 'component.switchLanguage': 'Vaihda kieleksi <1>{{ name }}</1>' })
			.withTranslations('pt-BR', 'registration', { 'component.switchLanguage': 'Mudar para <1>{{ name }}</1>' })
			.buildStoryDecorator(),
	],
	args: {
		browserLanguage: 'pt-BR',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof LoginSwitchLanguageFooter>;

export const Default: ComponentStory<typeof LoginSwitchLanguageFooter> = (args) => <LoginSwitchLanguageFooter {...args} />;
