import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import SearchResultsHeader from './SearchResultsHeader';

import '@testing-library/jest-dom';

const renderHeader = (props: Parameters<typeof SearchResultsHeader>[0]) =>
	render(<SearchResultsHeader {...props} />, {
		wrapper: mockAppRoot()
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
});
