import { createAppliedFilter, type AppliedFilter, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';

import '@testing-library/jest-dom';

jest.mock('./NavBarSearchMessageRow', () => () => null);

const SearchFormProvider = ({ children, filterText }: { children: ReactNode; filterText: string }) => {
	const methods = useForm<NavBarSearchFormValues>({
		defaultValues: {
			filterText,
			filters: [createAppliedFilter('in', 'general') as AppliedFilter],
		},
	});

	return <FormProvider {...methods}>{children}</FormProvider>;
};

const renderSection = (
	items: Parameters<typeof NavBarSearchIntelligentSection>[0]['items'],
	router: Partial<RouterContextValue> = {},
	onClose = jest.fn(),
	filterText = 'deployment errors',
) => {
	const appWrapper = mockAppRoot()
		.withTranslations('en', 'core', {
			Intelligent_Search: 'AI Search',
			AI_Search_related_messages: '{{count}} related message',
			View_all_results: 'View all results',
		})
		.withRouter(router)
		.build();

	render(
		<SearchFormProvider filterText={filterText}>
			<NavBarSearchIntelligentSection items={items} onSelect={jest.fn()} onClose={onClose} />
		</SearchFormProvider>,
		{ wrapper: appWrapper },
	);
};

describe('NavBarSearchIntelligentSection', () => {
	it('does not render the AI Search action without related results', () => {
		const buildRoutePath = jest.fn(() => '/search' as const);
		renderSection([], { buildRoutePath });

		expect(screen.queryByRole('link', { name: 'View all results' })).not.toBeInTheDocument();
		expect(buildRoutePath).not.toHaveBeenCalled();
	});

	it('links to the AI Search page from the section header and the footer when related results are available', async () => {
		const user = userEvent.setup();
		const buildRoutePath = jest.fn(() => '/search?q=in%3Ageneral%20deployment%20errors' as const);
		const onClose = jest.fn();
		renderSection(
			[
				{
					_id: 'message-id',
					msgId: 'message-id',
					text: 'Deployment failed during startup',
				},
			],
			{ buildRoutePath },
			onClose,
		);

		const actions = screen.getAllByRole('link', { name: 'View all results' });
		expect(actions).toHaveLength(2);
		expect(buildRoutePath).toHaveBeenCalledWith({
			name: 'search',
			search: { q: 'in:general deployment errors' },
		});

		for (const action of actions) {
			expect(action.tagName).toBe('A');
			expect(action).toHaveAttribute('href', '/search?q=in%3Ageneral%20deployment%20errors');

			action.addEventListener('click', (event) => event.preventDefault(), { once: true });
			await user.click(action);
		}
		expect(onClose).toHaveBeenCalledTimes(2);
	});

	it('leaves a filter that is still being typed out of the AI Search page link', () => {
		const buildRoutePath = jest.fn(() => '/search' as const);
		renderSection(
			[{ _id: 'message-id', msgId: 'message-id', text: 'Deployment failed' }],
			{ buildRoutePath },
			jest.fn(),
			'deployment errors from:jo',
		);

		expect(buildRoutePath).toHaveBeenCalledWith({ name: 'search', search: { q: 'in:general deployment errors' } });
	});

	it('keeps a filter that is followed by whitespace in the AI Search page link', () => {
		const buildRoutePath = jest.fn(() => '/search' as const);
		renderSection(
			[{ _id: 'message-id', msgId: 'message-id', text: 'Deployment failed' }],
			{ buildRoutePath },
			jest.fn(),
			'deployment errors from:john ',
		);

		expect(buildRoutePath).toHaveBeenCalledWith({ name: 'search', search: { q: 'in:general deployment errors from:john' } });
	});
});
