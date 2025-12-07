import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';

import InvitationBadge from './InvitationBadge';

const meta = {
	component: InvitationBadge,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Invited__date__: 'Invited {{date}}',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof InvitationBadge>;

export default meta;

export const Default = {
	args: {
		invitationDate: '2025-01-01T12:00:00Z',
	},
};
