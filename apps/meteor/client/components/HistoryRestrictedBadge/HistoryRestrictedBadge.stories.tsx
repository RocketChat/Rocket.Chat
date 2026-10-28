import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';

import HistoryRestrictedBadge from './HistoryRestrictedBadge';

const meta = {
	component: HistoryRestrictedBadge,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Messages_hidden_before_date: 'Messages before {{date}} hidden',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof HistoryRestrictedBadge>;

export default meta;

export const Default = {
	args: {
		historyVisibleFrom: '2026-10-01T12:00:00Z',
	},
};
