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
					Attribute_based_access_control: 'Attribute-Based Access Control',
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
		abacAttributes: ['Classified', 'Top Secret', 'Confidential'],
	},
};

export const SingleAttribute: Story = {
	args: {
		abacAttributes: ['Top Secret'],
	},
};

export const MultipleAttributes: Story = {
	args: {
		abacAttributes: ['Top Secret', 'Classified', 'Confidential', 'Restricted', 'Internal'],
	},
};

export const LongAttributeNames: Story = {
	args: {
		abacAttributes: [
			'Top Secret - Compartmented',
			'Classified - Special Access',
			'Confidential - Restricted Data',
			'Internal - Sensitive',
			'Public - Unclassified',
		],
	},
};

export const SpecialCharacters: Story = {
	args: {
		abacAttributes: ['Classified@DOD.mil', 'Top-Secret_2024', 'Confidential.Project', 'Restricted-Access'],
	},
};
