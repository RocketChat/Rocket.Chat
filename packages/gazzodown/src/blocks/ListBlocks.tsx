import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

import { isOrderedListRun, splitListItemRuns } from './splitListItemRuns';
import InlineElements from '../elements/InlineElements';

type ListBlockProps = {
	items: MessageParser.ListItem[];
	nested?: boolean;
};

const nestedListStyle = {
	paddingInlineStart: '1.5rem',
} as const;

const NestedLists = ({ items }: { items: MessageParser.ListItem[] }): ReactElement => (
	<>
		{splitListItemRuns(items).map((run, index) =>
			isOrderedListRun(run) ? (
				<OrderedListBlock key={index} items={run} nested />
			) : (
				<UnorderedListBlock key={index} items={run} nested />
			),
		)}
	</>
);

export const OrderedListBlock = ({ items, nested = false }: ListBlockProps): ReactElement => (
	<ol style={nested ? nestedListStyle : undefined}>
		{items.map(({ value, number, children }, index) => (
			<li key={index} value={number}>
				<InlineElements>{value}</InlineElements>
				{children?.length ? <NestedLists items={children} /> : null}
			</li>
		))}
	</ol>
);

export const UnorderedListBlock = ({ items, nested = false }: ListBlockProps): ReactElement => (
	<ul style={nested ? nestedListStyle : undefined}>
		{items.map((item, index) => (
			<li key={index}>
				<InlineElements>{item.value}</InlineElements>
				{item.children?.length ? <NestedLists items={item.children} /> : null}
			</li>
		))}
	</ul>
);
