import { AutoComplete, Chip, Box, Item, ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { ITEM_MEDIA_SIZE, RoomAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import { useChannelsData } from './hooks/useChannelsData';
import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';

type MultiChannelsSelectProps = BlockProps<UiKit.MultiChannelsSelectElement>;

const MultiChannelsSelectElement = ({ block, context }: MultiChannelsSelectProps) => {
	const [{ value, loading }, action] = useUiKitState(block, context);

	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);

	const options = useChannelsData({ filter: filterDebounced });

	const handleChange = useCallback(
		(value: string | string[]) => {
			if (Array.isArray(value)) void action({ target: { value } });
		},
		[action],
	);

	return (
		<AutoComplete
			value={value || []}
			disabled={loading}
			onChange={handleChange}
			filter={filter}
			setFilter={setFilter}
			multiple
			renderSelected={({ selected: { value, label }, onRemove, ...props }) => (
				<Chip key={value} {...props} value={value} onClick={onRemove}>
					<RoomAvatar size='x20' room={{ _id: value, ...label, type: label?.type || 'c' }} />
					<Box is='span' margin='none' marginInlineStart={4}>
						{label?.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, selected, focus, ...props }) => (
				<Item {...props} is='li' inset='md' selected={selected} focused={focus} aria-selected={selected}>
					<ItemMedia>
						<RoomAvatar size={ITEM_MEDIA_SIZE.condensed} room={{ _id: value, ...label, type: label?.type || 'c' }} />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{label.name}</ItemTitle>
					</ItemContent>
				</Item>
			)}
			options={options}
		/>
	);
};

export default memo(MultiChannelsSelectElement);
