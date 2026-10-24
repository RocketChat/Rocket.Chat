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
		<ul data-testid='message-search-list' data-total-count={totalCount}>
			{items.map((item, index) => (
				<li key={item._id}>{renderItem(item, index)}</li>
			))}
		</ul>
	),
}));

jest.mock('../../../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('../../../MessageList/providers/MessageListProvider', () => ({ children }: PropsWithChildren) => <>{children}</>);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const trimTrailingWhitespace = (node: HTMLElement): HTMLElement => {
	const clone = node.cloneNode(true) as HTMLElement;
	const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
	const nodesToRemove: Node[] = [];

	for (let textNode = walker.nextNode(); textNode; textNode = walker.nextNode()) {
		const textContent = textNode.textContent ?? '';
		if (/^\s+$/.test(textContent)) {
			nodesToRemove.push(textNode);
			continue;
		}

		textNode.textContent = textContent.replace(/[ \t]+$/gm, '');
	}

	nodesToRemove.forEach((textNode) => textNode.parentNode?.removeChild(textNode));

	return clone;
};

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />);
	expect(trimTrailingWhitespace(baseElement)).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container, {
		rules: {
			'nested-interactive': { enabled: false },
			'aria-required-parent': { enabled: false },
		},
	});
	expect(results).toHaveNoViolations();
});
