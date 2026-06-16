import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { PropsWithChildren, ReactNode } from 'react';

import * as stories from './MessageSearch.stories';
import type { MessageSearchItem } from '../hooks/useMessageSearchQuery';

jest.mock('../../../../../components/PaginatedVirtualList', () => ({
	PaginatedVirtualList: ({
		items,
		totalCount,
		renderItem,
	}: {
		items: MessageSearchItem[];
		totalCount: number;
		renderItem: (item: MessageSearchItem, index: number) => ReactNode;
	}) => (
		<div data-testid='message-search-list' data-total-count={totalCount}>
			{items.map((item, index) => (
				<div key={item._id}>{renderItem(item, index)}</div>
			))}
		</div>
	),
}));

jest.mock('../../../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('../../../MessageList/providers/MessageListProvider', () => ({ children }: PropsWithChildren) => <>{children}</>);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container, {
		rules: {
			'nested-interactive': { enabled: false },
			'aria-required-parent': { enabled: false },
			'aria-required-children': { enabled: false },
		},
	});
	expect(results).toHaveNoViolations();
});
