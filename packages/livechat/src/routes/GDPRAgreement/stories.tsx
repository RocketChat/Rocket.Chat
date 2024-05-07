import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { screenDecorator } from '../../../.storybook/helpers';
import GDPRAgreement from './component';

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

const Template: Story<ComponentProps<typeof GDPRAgreement>> = (args) => <GDPRAgreement {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
