import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AbacMembershipPreview from './AbacMembershipPreview';

const members = ['aisha.khan', 'liam.johnson', 'nina.petrov', 'ava.garcia', 'ethan.brown'].map((username) => ({
	_id: username,
	username,
	name: username
		.split('.')
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join(' '),
}));

const meta = {
	component: AbacMembershipPreview,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withTranslations('en', 'core', {
					ABAC_Preview_Compliant: 'Compliant',
					ABAC_Preview_Creator_Not_Added: 'You do not hold these attributes, so you will not be added to this room.',
					ABAC_Preview_Inconclusive: 'Access undetermined',
					ABAC_Preview_Inconclusive_Warning: 'Access could not be determined for some members. They will not be added to this room.',
					ABAC_Preview_No_Compliant_Members: 'Cannot create a room with no compliant members.',
					ABAC_Preview_Non_Compliant: 'Non-compliant',
					ABAC_Preview_Only_Compliant_Added: 'Only attribute compliant users can be added to ABAC rooms.',
					ABAC_Preview_Unavailable: 'Could not check who will have access. Try again later.',
				})
				.build();

			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof AbacMembershipPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllCompliant: Story = {
	args: { data: { compliant: members, nonCompliant: [], inconclusive: [], creator: 'compliant' } },
};

export const SomeNonCompliant: Story = {
	args: { data: { compliant: members.slice(0, 3), nonCompliant: members.slice(3), inconclusive: [], creator: 'compliant' } },
};

export const NoCompliant: Story = {
	args: { data: { compliant: [], nonCompliant: members, inconclusive: [], creator: 'nonCompliant' } },
};

export const CreatorNotAdded: Story = {
	args: { data: { compliant: members.slice(1), nonCompliant: members.slice(0, 1), inconclusive: [], creator: 'nonCompliant' } },
};

export const Inconclusive: Story = {
	args: { data: { compliant: members.slice(0, 3), nonCompliant: [], inconclusive: members.slice(3), creator: 'compliant' } },
};

export const Pending: Story = {
	args: { isPending: true },
};

export const Unavailable: Story = {
	args: { isError: true },
};
