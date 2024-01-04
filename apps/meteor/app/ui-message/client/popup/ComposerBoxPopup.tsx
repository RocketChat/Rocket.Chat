import { Box, Option, OptionSkeleton, Tile } from '@rocket.chat/fuselage';
import { useUniqueId, useContentBoxSize } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useEffect, memo, useMemo, useRef } from 'react';

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
	const composerBoxPopupRef = useRef<HTMLElement>(null);
	const popupSizes = useContentBoxSize(composerBoxPopupRef);

	const variant = popupSizes && popupSizes.inlineSize < 480 ? 'small' : 'large';

	const getOptionTitle = <T extends { _id: string; sort?: number; outside?: boolean; suggestion?: boolean }>(item: T) => {
		if (variant !== 'small') {
			return undefined;
		}

		if (item.outside) {
			return t('Not_in_channel');
		}

		if (item.suggestion) {
			return t('Suggestion_from_recent_messages');
		}
	};

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
			<Tile ref={composerBoxPopupRef} className='message-popup' padding={0} role='menu' mbe={8} overflow='hidden' aria-labelledby={id}>
				{title && (
					<Box bg='tint' pi={16} pb={8} id={id}>
						{title}
					</Box>
				)}
				<Box pb={8} maxHeight='x320'>
					{!isLoading && itemsFlat.length === 0 && <Option>{t('No_results_found')}</Option>}
					{isLoading && <OptionSkeleton />}
					{itemsFlat.map((item, index) => {
						return (
							<Option
								title={getOptionTitle(item)}
								onClick={() => select(item)}
								selected={item === focused}
								key={index}
								id={`popup-item-${item._id}`}
								tabIndex={item === focused ? 0 : -1}
								aria-selected={item === focused}
							>
								{renderItem({ item: { ...item, variant } })}
							</Option>
						);
					})}
				</Box>
			</Tile>
		</Box>
	);
};

export default memo(ComposerBoxPopup);
