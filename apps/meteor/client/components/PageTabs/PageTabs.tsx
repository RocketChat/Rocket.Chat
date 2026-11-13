import { Box, Tabs, TabsItem } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type PageTabsItem<TId extends string> = {
	id: TId;
	label: ReactNode;
	/** Shown after the label, such as a count or its loading skeleton */
	counter?: ReactNode;
	hidden?: boolean;
	disabled?: boolean;
};

export type PageTabsProps<TId extends string> = {
	items: PageTabsItem<TId>[];
	selected: TId | undefined;
	onSelect: (id: TId) => void;
};

/**
 * The tabs that switch between the views of a page.
 */
const PageTabs = <TId extends string>({ items, selected, onSelect }: PageTabsProps<TId>) => (
	<Tabs>
		{items
			.filter((item) => !item.hidden)
			.map(({ id, label, counter, disabled }) => (
				<TabsItem
					key={id}
					selected={id === selected}
					disabled={disabled}
					aria-disabled={disabled}
					onClick={disabled ? undefined : () => onSelect(id)}
				>
					{counter === undefined ? (
						label
					) : (
						<Box is='span' display='flex' alignItems='center' gap='x8'>
							{label}
							{counter}
						</Box>
					)}
				</TabsItem>
			))}
	</Tabs>
);

export default PageTabs;
