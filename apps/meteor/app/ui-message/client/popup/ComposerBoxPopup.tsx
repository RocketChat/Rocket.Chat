import { Box, Option, OptionSkeleton, Tile } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useEffect, memo, useMemo } from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

export type ComposerBoxPopupProps<
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

const ComposerBoxPopup = <
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
	const t = useTranslation();
	const id = useUniqueId();

	const itemsFlat = useMemo(
		() =>
			items
				.flatMap((item) => {
					if (item.isSuccess) {
						return item.data;
					}
					return [];
				})
				.sort((a, b) => (('sort' in a && a.sort) || 0) - (('sort' in b && b.sort) || 0)),
		[items],
	);

	const isLoading = items.some((item) => item.isLoading && item.fetchStatus !== 'idle');

	useEffect(() => {
		if (focused) {
			const element = document.getElementById(`popup-item-${focused._id}`);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}, [focused]);

	return (
		<Box className='message-popup-position' position='relative'>
			<Tile className='message-popup' padding={0} role='menu' mbe='x8' aria-labelledby={id}>
				{title && (
					<Box bg='tint' pi='x16' pb='x8' id={id}>
						{title}
					</Box>
				)}
				<Box pb='x8' maxHeight='x320'>
					{!isLoading && itemsFlat.length === 0 && <Option>{t('No_results_found')}</Option>}
					{itemsFlat.map((item, index) => {
						return (
							<Option
								onClick={() => select(item)}
								selected={item === focused}
								key={index}
								id={`popup-item-${item._id}`}
								tabIndex={item === focused ? 0 : -1}
								aria-selected={item === focused}
							>
								{renderItem({ item })}
							</Option>
						);
					})}
					{isLoading && <OptionSkeleton />}
				</Box>
			</Tile>
		</Box>
	);
};

export default memo(ComposerBoxPopup);
