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

export const WithISOStringDate = {
	args: {
		invitationDate: '2025-01-01T12:00:00Z',
	},
};

export const WithDateObject = {
	args: {
		invitationDate: new Date('2025-01-01T12:00:00Z'),
	},
};
