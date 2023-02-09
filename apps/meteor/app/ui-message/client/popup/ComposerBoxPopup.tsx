import { Box, Option, OptionSkeleton, Tile } from '@rocket.chat/fuselage';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

type ComposerBoxPopupProps<
	T extends {
		_id: string;
		sort: number;
	},
> = {
	title?: string;
	focused?: T;
	items: UseQueryResult<T[]>[];
	renderItem?: ({ item }: { item: T }) => ReactElement;
};

export const ComposerBoxPopup = <
	T extends {
		_id: string;
		sort: number;
	},
>({
	title,
	items,
	focused,
	renderItem = ({ item }: { item: T }) => <>{JSON.stringify(item)}</>,
}: ComposerBoxPopupProps<T>): ReactElement | null => {
	return (
		<div className='message-popup-position'>
			<Tile className='message-popup' padding={0} role='menu'>
				{title && (
					<Box bg='tint' pi='x16' pb='x8'>
						{title}
					</Box>
				)}
				<Box pb='x8'>
					{items
						.flatMap((item) => {
							if (item.isSuccess) {
								return item.data;
							}
							return [];
						})
						.sort((a, b) => a.sort - b.sort)
						.map((item, index) => {
							return (
								<Option role='menuitem' tabindex={item === focused ? 0 : -1} selected={item === focused} key={index}>
									{renderItem({ item })}
								</Option>
							);
						})}
					{items.some((item) => item.isLoading) && <OptionSkeleton />}
				</Box>
			</Tile>
		</div>
	);
};
