import { Box, Option, OptionSkeleton, Tile } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

type ComposerBoxPopupProps<
	T extends {
		_id: string;
		sort?: number;
	},
> = {
	title?: string;
	focused?: T;
	items: UseQueryResult<T[]>[];
	select: (item: T) => void;
	renderItem?: ({ item }: { item: T }) => ReactElement;
};

export const ComposerBoxPopup = <
	T extends {
		_id: string;
		sort?: number;
	},
>({
	title,
	items,
	focused,
	select,
	renderItem = ({ item }: { item: T }) => <>{JSON.stringify(item)}</>,
}: ComposerBoxPopupProps<T>): ReactElement | null => {
	const id = useUniqueId();
	return (
		<Box className='message-popup-position' position='relative'>
			<Tile className='message-popup' padding={0} role='menu' mbe='x2' maxHeight='20rem' aria-labelledby={id}>
				{title && (
					<Box bg='tint' pi='x16' pb='x8' id={id}>
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
						.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0))
						.map((item, index) => {
							return (
								<Option
									onClick={() => select(item)}
									selected={item === focused}
									key={index}
									id={`popup-item-${item._id}`}
									tabIndex={item === focused ? 0 : -1}
								>
									{renderItem({ item })}
								</Option>
							);
						})}
					{items.some((item) => item.isLoading && item.fetchStatus !== 'idle') && <OptionSkeleton />}
				</Box>
			</Tile>
		</Box>
	);
};
