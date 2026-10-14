import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import SearchResultsHeader from './SearchResultsHeader';

import '@testing-library/jest-dom';

const renderHeader = (props: Parameters<typeof SearchResultsHeader>[0]) =>
	render(<SearchResultsHeader {...props} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Search_results_for: 'Results for <bold>{{query}}</bold>',
				Intelligent_Search_page_empty_state: 'Use the top search bar to ask a question.',
				Intelligent_Search_scope_all_rooms: 'Limited to rooms you can access where AI search is enabled',
			})
			.build(),
	});

describe('SearchResultsHeader', () => {
	it('renders the applied filters', () => {
		renderHeader({
			query: 'vacation policy',
			filters: [
				{ id: 'in-general', key: 'in', value: 'general' },
				{ id: 'from-thomas', key: 'from', value: 'thomas.berger' },
			],
		});

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for vacation policy');
		expect(screen.getByText('#general')).toBeInTheDocument();
		expect(screen.getByText('@thomas.berger')).toBeInTheDocument();
	});

	it('asks for a query when there is none', () => {
		renderHeader({ query: '', filters: [] });

		expect(screen.getByText('Use the top search bar to ask a question.')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
	});
});
