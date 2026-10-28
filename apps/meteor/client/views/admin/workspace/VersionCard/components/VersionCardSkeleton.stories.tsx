import { Card } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import { VersionCardSkeleton } from './VersionCardSkeleton';

export default {
	component: VersionCardSkeleton,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
	],
} satisfies Meta<typeof VersionCardSkeleton>;

export const Default: StoryObj<typeof VersionCardSkeleton> = {};
