import { describe, it } from 'node:test';

import { emptySearchFilters, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import type { FunctionLike } from 'jest-mock';
import { fn } from 'jest-mock';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

const SearchFormProvider = ({ children }: { children: ReactNode }) => {
	const methods = useForm<NavBarSearchFormValues>({
		defaultValues: {
			filterText: 'deployment errors',
			appliedFilters: { ...emptySearchFilters(), roomNames: ['general'] },
		},
	});

	return <FormProvider {...methods}>{children}</FormProvider>;
};

const { default: NavBarSearchIntelligentSection } = proxyquire
	.noCallThru()
	.load<typeof import('./NavBarSearchIntelligentSection')>('./NavBarSearchIntelligentSection', {
		'./NavBarSearchMessageRow': (
			() => () =>
				null
		)(),
	});

const renderSection = (
	items: Parameters<typeof NavBarSearchIntelligentSection>[0]['items'],
	router: Partial<RouterContextValue> = {},
	onClose = fn<FunctionLike>(),
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
		<SearchFormProvider>
			<NavBarSearchIntelligentSection items={items} onSelect={fn<FunctionLike>()} onClose={onClose} />
		</SearchFormProvider>,
		{ wrapper: appWrapper },
	);
};

describe('NavBarSearchIntelligentSection', () => {
	it('does not render the AI Search action without related results', () => {
		const buildRoutePath = fn<FunctionLike>(() => '/search' as const);
		renderSection([], { buildRoutePath });

		expect(screen.queryByText('View all results')).not.toBeInTheDocument();
		expect(buildRoutePath).not.toHaveBeenCalled();
	});

	it('renders a native link to the AI Search page when related results are available', async () => {
		const user = userEvent.setup();
		const buildRoutePath = fn<FunctionLike>(() => '/search?q=in%3Ageneral%20deployment%20errors' as const);
		const onClose = fn<FunctionLike>();
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

		const action = screen.getByRole('option', { name: 'View all results' });
		expect(action.tagName).toBe('A');
		expect(action).toHaveAttribute('href', '/search?q=in%3Ageneral%20deployment%20errors');
		expect(buildRoutePath).toHaveBeenCalledWith({
			name: 'search',
			search: { q: 'in:general deployment errors' },
		});

		action.addEventListener('click', (event) => event.preventDefault(), { once: true });
		await user.click(action);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
