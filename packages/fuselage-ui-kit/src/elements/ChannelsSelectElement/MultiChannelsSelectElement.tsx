import { AutoComplete, Option, Chip, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import { useChannelsData } from './hooks/useChannelsData';
import { useConversationsData } from './hooks/useConversationsData';
import { useCurrentConversationDefault } from './hooks/useCurrentConversationDefault';
import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';
import { getAutoCompleteKey } from '../../utils/getAutoCompleteKey';
import { limitOptions } from '../../utils/limitOptions';

type MultiChannelsSelectProps = BlockProps<UiKit.MultiChannelsSelectElement | UiKit.MultiConversationsSelectElement>;

const MultiChannelsSelectElement = ({ block, context }: MultiChannelsSelectProps) => {
	const element = useCurrentConversationDefault(block);
	const [{ value, loading }, action] = useUiKitState(element, context);

	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);

	const isConversations = block.type === 'multi_conversations_select';
	const channels = useChannelsData({ filter: filterDebounced, enabled: !isConversations, selected: value ?? [] });
	const conversations = useConversationsData({
		filter: filterDebounced,
		enabled: isConversations,
		selected: value ?? [],
		include: block.type === 'multi_conversations_select' ? block.filter?.include : undefined,
	});
	const options = isConversations ? conversations : channels;

	const handleChange = useCallback(
		(value: string | string[]) => {
			if (Array.isArray(value)) void action({ target: { value } });
		},
		[action],
	);

	return (
		<AutoComplete
			key={getAutoCompleteKey(value, options)}
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
			renderItem={({ value, label, ...props }) => (
				<Option
					key={value}
					{...props}
					label={label.name}
					avatar={<RoomAvatar size='x20' room={{ _id: value, ...label, type: label?.type || 'c' }} />}
				/>
			)}
			options={limitOptions(options, value, block.max_selected_items)}
		/>
	);
};

export default memo(MultiChannelsSelectElement);
