import { Box, Item, ItemContent, ItemGroup, ItemGroupHeader, ItemGroupTitle, ItemSkeleton, ItemTitle, Tile } from '@rocket.chat/fuselage';
import { useContentBoxSize } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, memo, useMemo, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';

export type ComposerBoxPopupProps<
	T extends {
		_id: string;
		sort?: number;
		disabled?: boolean;
	},
> = {
	title?: string;
	focused?: T;
	items: UseQueryResult<T[]>[];
	select: (item: T) => void;
	renderItem?: ({ item }: { item: T }) => ReactNode;
};

function ComposerBoxPopup<
	T extends {
		_id: string;
		sort?: number;
		disabled?: boolean;
	},
>({ title, items, focused, select, renderItem = ({ item }: { item: T }) => <>{JSON.stringify(item)}</> }: ComposerBoxPopupProps<T>) {
	const { t } = useTranslation();
	const id = useId();
	const composerBoxPopupRef = useRef<HTMLElement>(null);
	const popupSizes = useContentBoxSize(composerBoxPopupRef);

	const variant = popupSizes && popupSizes.inlineSize < 480 ? 'small' : 'large';

	const getOptionTitle = <T extends { _id: string; sort?: number; outside?: boolean; suggestion?: boolean; disabled?: boolean }>(
		item: T,
	) => {
		if (variant !== 'small') {
			return undefined;
		}

		if (item.outside) {
			return t('Not_in_channel');
		}

		if (item.suggestion) {
			return t('Suggestion_from_recent_messages');
		}

		if (item.disabled) {
			return t('Unavailable_in_encrypted_channels');
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
		<Box position='relative'>
			<Tile ref={composerBoxPopupRef} padding={0} marginBlockEnd={8} overflow='hidden'>
				{title && (
					<Box backgroundColor='tint'>
						<ItemGroupHeader inset='md'>
							<ItemGroupTitle id={id}>{title}</ItemGroupTitle>
						</ItemGroupHeader>
					</Box>
				)}
				<CustomScrollbars>
					<Box paddingBlock={8} maxHeight='x320'>
						{!isLoading && itemsFlat.length === 0 && (
							<Item size='medium' inset='md' role='status'>
								<ItemContent>
									<ItemTitle>{t('No_results_found')}</ItemTitle>
								</ItemContent>
							</Item>
						)}
						{isLoading && <ItemSkeleton size='medium' inset='md' />}
						<ItemGroup role='listbox' aria-labelledby={title ? id : undefined} aria-busy={isLoading}>
							{itemsFlat.map((item, index) => (
								<Item
									key={index}
									id={`popup-item-${item._id}`}
									role='option'
									size='medium'
									inset='md'
									title={getOptionTitle(item)}
									focused={item === focused}
									aria-selected={item === focused}
									disabled={item.disabled}
									aria-disabled={item.disabled || undefined}
									tabIndex={-1}
									onClick={() => select(item)}
								>
									{renderItem({ item: { ...item, variant } })}
								</Item>
							))}
						</ItemGroup>
					</Box>
				</CustomScrollbars>
			</Tile>
		</Box>
	);
}

export default memo(ComposerBoxPopup);
