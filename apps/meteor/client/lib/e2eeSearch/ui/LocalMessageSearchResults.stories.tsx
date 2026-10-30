import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import LocalMessageSearchResults from './LocalMessageSearchResults';
import LocalSearchResultsPreview from './layout/LocalSearchResultsPreview';

const meta = {
	component: LocalMessageSearchResults,
	decorators: [
		(Story) => (
			<LocalSearchResultsPreview>
				<Story />
			</LocalSearchResultsPreview>
		),
	],
	args: {
		id: 'local-search-results',
		showUserAvatar: true,
		onOpenHit: action('onOpenHit'),
		hits: [
			{
				id: 'message',
				rid: 'room',
				uid: 'alice',
				username: 'alice',
				displayName: 'Alice Doe',
				ts: Date.UTC(2026, 9, 26, 12),
				snippet: 'The <mark>needle</mark> is here.',
			},
			{
				id: 'file',
				rid: 'room',
				uid: 'bob',
				username: 'bob',
				displayName: 'bob',
				ts: Date.UTC(2026, 9, 26, 10),
				snippet: 'Q3 <mark>budget</mark> draft\nbudget-2026.pdf',
			},
			{
				id: 'reply',
				rid: 'room',
				tmid: 'thread',
				uid: 'carol',
				username: 'carol',
				displayName: 'carol',
				ts: Date.UTC(2026, 9, 25, 12),
				snippet: 'A thread <mark>reply</mark>.',
			},
		],
	},
} satisfies Meta<typeof LocalMessageSearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutAvatars: Story = { args: { showUserAvatar: false } };
export const Empty: Story = { args: { hits: [] } };
export const Paginated: Story = { args: { onEndReached: action('onEndReached') } };
