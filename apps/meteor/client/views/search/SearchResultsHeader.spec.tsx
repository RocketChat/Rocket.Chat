import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import SearchResultsHeader from './SearchResultsHeader';

import '@testing-library/jest-dom';

const renderHeader = (props: Parameters<typeof SearchResultsHeader>[0], subscriptions: SubscriptionWithRoom[] = []) =>
	render(<SearchResultsHeader {...props} />, {
		wrapper: mockAppRoot()
			.withSubscriptions(subscriptions)
			.withTranslations('en', 'core', {
				Search_results_for: 'Results for <bold>{{query}}</bold>',
				Intelligent_Search_page_empty_state: 'AI search results will appear here',
				Intelligent_Search_scope_all_rooms: 'Limited to rooms you can access where AI search is enabled',
			})
			.build(),
	});

describe('SearchResultsHeader', () => {
	it('renders the applied filters as typed in the search bar', () => {
		renderHeader({
			query: 'vacation policy',
			filters: [
				{ id: 'before-2026-07-21', key: 'before', value: '2026-07-21' },
				{ id: 'in-general', key: 'in', value: 'general' },
				{ id: 'from-thomas', key: 'from', value: 'thomas.berger' },
				{ id: 'in-release-notes', key: 'in', value: 'release notes' },
			],
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for vacation policy');
		expect(screen.getByText('before:2026-07-21')).toBeInTheDocument();
		expect(screen.getByText('in:general')).toBeInTheDocument();
		expect(screen.getByText('from:thomas.berger')).toBeInTheDocument();
		expect(screen.getByText('in:"release notes"')).toBeInTheDocument();
	});

	it('shows the display name of a discussion filter instead of its generated name', () => {
		renderHeader({ query: 'rollout', filters: [{ id: 'in:6bxempwpapykcmkcu', key: 'in', value: '6bXEMpwPaPykCmKcu' }] }, [
			{
				_id: 'sub-id',
				rid: 'discussion-id',
				prid: 'parent-id',
				name: '6bXEMpwPaPykCmKcu',
				fname: 'XMPP rollout',
			} as unknown as SubscriptionWithRoom,
		]);

		expect(screen.getByText('in:"XMPP rollout"')).toBeInTheDocument();
		expect(screen.queryByText('in:6bXEMpwPaPykCmKcu')).not.toBeInTheDocument();
	});
});
