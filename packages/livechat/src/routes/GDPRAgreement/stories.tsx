import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { screenDecorator, screenProps } from '../../helpers.stories';
import GDPRAgreement from './component';

export default {
	title: 'Routes/GDPRAgreement',
	component: GDPRAgreement,
	args: {
		title: 'GDPR',
		consentText: '',
		instructions: '',
		onAgree: action('agree'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof GDPRAgreement>;

const Template: ComponentStory<typeof GDPRAgreement> = (args) => <GDPRAgreement {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
