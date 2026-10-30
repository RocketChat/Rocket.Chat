import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import LocalSearchOptInField from './LocalSearchOptInField';

export default {
	component: LocalSearchOptInField,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				E2E_Local_Search_Opt_In: 'Index my encrypted messages on this device',
				E2E_Local_Search_Opt_In_Description:
					'Search encrypted messages on this device. If you disable this option, the app deletes the local index.',
			})
			.buildStoryDecorator(),
	],
	args: { checked: false, onChange: action('change') },
} satisfies Meta<typeof LocalSearchOptInField>;

export const Off: StoryObj<typeof LocalSearchOptInField> = {};
export const On: StoryObj<typeof LocalSearchOptInField> = { args: { checked: true } };
