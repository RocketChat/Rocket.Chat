import { Box, Tile } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { type ComponentStory, type ComponentMeta } from '@storybook/react';
import { createElement } from 'react';
import { useTranslation } from 'react-i18next';

import LoginSwitchLanguageFooter from './LoginSwitchLanguageFooter';

export default {
	title: 'components/LoginSwitchLanguageFooter',
	component: LoginSwitchLanguageFooter,
	decorators: [
		(fn) =>
			createElement(function ExampleTranslationDecorator() {
				const { t } = useTranslation();

				return (
					<Box>
						<Tile>{t('example.text')}</Tile>
						{fn()}
					</Box>
				);
			}),
		mockAppRoot()
			.withSetting('Language', 'fi')
			.withTranslations('en', 'registration', { 'component.switchLanguage': 'Change to <1>{{ name }}</1>' })
			.withTranslations('en', 'example', { text: 'Hello!' })
			.withTranslations('fi', 'registration', { 'component.switchLanguage': 'Vaihda kieleksi <1>{{ name }}</1>' })
			.withTranslations('fi', 'example', { text: 'Hei!' })
			.withTranslations('pt-BR', 'registration', { 'component.switchLanguage': 'Mudar para <1>{{ name }}</1>' })
			.withTranslations('pt', 'example', { text: 'Olá!' })
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
