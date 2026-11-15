import type { Meta, StoryFn } from '@storybook/preact';

import GDPRAgreement, { type GDPRAgreementProps } from './index';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/GDPRAgreement',
	component: GDPRAgreement,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<GDPRAgreementProps>;

const Template: StoryFn<GDPRAgreementProps> = (args) => <GDPRAgreement {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
