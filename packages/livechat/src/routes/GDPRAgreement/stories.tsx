import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import GDPRAgreement from './component';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/GDPRAgreement',
	component: GDPRAgreement,
	args: {
		title: 'GDPR',
		consentText: '',
		instructions: '',
		onAgree: action('agree'),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof GDPRAgreement>>;

const Template: StoryFn<ComponentProps<typeof GDPRAgreement>> = (args) => <GDPRAgreement {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
