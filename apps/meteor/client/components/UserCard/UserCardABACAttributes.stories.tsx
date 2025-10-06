import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import UserCardABACAttributes from './UserCardABACAttributes';

const meta = {
	component: UserCardABACAttributes,
	parameters: {
		layout: 'centered',
	},
	args: {
		abacAttributes: ['Classified', 'Top Secret', 'Confidential'],
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withTranslations('en', 'core', {
					ABAC_attributes: 'ABAC Attributes',
					ABAC_Attributes_description: 'Attribute-Based Access Control',
				})
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof UserCardABACAttributes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		abacAttributes: ['Top Secret', 'Classified', 'Confidential', 'Restricted', 'Internal'],
	},
};
