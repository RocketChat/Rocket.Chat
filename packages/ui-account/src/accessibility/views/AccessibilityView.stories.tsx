import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AccessibilityView from './AccessibilityView';
import type { AccessibilityPreferencesViewModel } from '../logic/useAccessibilityPreferences';

const createViewModel = (overrides: Partial<AccessibilityPreferencesViewModel> = {}): AccessibilityPreferencesViewModel => ({
	values: {
		themeAppearence: 'auto',
		fontSize: '100%',
		mentionsWithSymbol: false,
		clockMode: 0,
		hideUsernames: false,
		hideRoles: false,
	},
	displayRolesEnabled: true,
	save: async () => undefined,
	...overrides,
});

const meta = {
	component: AccessibilityView,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				'12_Hour': '12-hour clock',
				'24_Hour': '24-hour clock',
				'Accessibility_activation': 'Here you can activate a range of features to enhance your browsing experience.',
				'Accessibility_and_Appearance': 'Accessibility & appearance',
				'Accessibility_feature_documentation': 'Accessibility feature documentation',
				'Accessibility_statement': 'Accessibility statement',
				'Adjustable_font_size_description':
					'Designed for those who prefer larger or smaller text for improved readability. This flexibility promotes inclusivity by empowering users to tailor the software interface to their specific needs.',
				'Adjustable_layout': 'Adjustable layout',
				'Cancel': 'Cancel',
				'Default': 'Default',
				'Font_Default': 'Default',
				'Font_Extra_large': 'Extra large',
				'Font_Large': 'Large',
				'Font_Medium': 'Medium',
				'Font_Small': 'Small',
				'Font_size': 'Font size',
				'Glossary_of_simplified_terms': 'Glossary of simplified terms',
				'Learn_more_about_accessibility': 'Learn more about our commitment with accessibility here:',
				'Mentions_with_@_symbol': 'Mentions with @ symbol',
				'Mentions_with_@_symbol_description':
					'Mentions notify and highlight messages for groups or specific users, facilitating targeted communication.\n\nThe screen reader functionality is optimized when the "@" symbol is employed in the mention feature. This ensures that users relying on screen readers can easily interpret and engage with these mentions.',
				'Message_TimeFormat': 'Time format',
				'Save_changes': 'Save changes',
				'Show_or_hide_the_user_roles_of_message_authors': 'Show or hide the user roles of message authors.',
				'Show_or_hide_the_username_of_message_authors': 'Show or hide the username of message authors.',
				'Show_roles': 'Show roles',
				'Show_usernames': 'Show usernames',
				'Theme': 'Theme',
				'Theme_dark': 'Dark',
				'Theme_dark_description':
					'Reduce eye strain and fatigue in low-light conditions by minimizing the amount of light emitted by the screen.',
				'Theme_high_contrast': 'High contrast',
				'Theme_high_contrast_description':
					'Maximum tonal differentiation with bold colors and sharp contrasts provide enhanced accessibility.',
				'Theme_light': 'Light',
				'Theme_light_description': 'More accessible for individuals with visual impairments and a good choice for well-lit environments.',
				'Theme_match_system': 'Match system',
				'Theme_match_system_description': 'Automatically match the appearance of your system.',
			})
			.buildStoryDecorator(),
		(Story) => <Story />,
	],
} satisfies Meta<typeof AccessibilityView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { vm: createViewModel() },
};

export const DarkThemeCustomized: Story = {
	args: {
		vm: createViewModel({
			values: { themeAppearence: 'dark', fontSize: '100%', mentionsWithSymbol: true, clockMode: 2, hideUsernames: true, hideRoles: true },
		}),
	},
};

export const RolesDisabled: Story = {
	args: { vm: createViewModel({ displayRolesEnabled: false }) },
};
