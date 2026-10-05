import { AutoComplete, Option, Box, Chip } from '@rocket.chat/fuselage';
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

export type ChannelsSelectElementProps = BlockProps<UiKit.ChannelsSelectElement | UiKit.ConversationsSelectElement>;

const ChannelsSelectElement = ({ block, context }: ChannelsSelectElementProps) => {
	const element = useCurrentConversationDefault(block);
	const [{ value, loading }, action] = useUiKitState(element, context);

	const [filter, setFilter] = useState('');
	const filterDebounced = useDebouncedValue(filter, 300);

	const isConversations = block.type === 'conversations_select';
	const channels = useChannelsData({ filter: filterDebounced, enabled: !isConversations, selected: value ? [value] : [] });
	const conversations = useConversationsData({
		filter: filterDebounced,
		enabled: isConversations,
		selected: value ? [value] : [],
		include: block.type === 'conversations_select' ? block.filter?.include : undefined,
	});
	const options = isConversations ? conversations : channels;

	const handleChange = useCallback(
		(value: string | string[]) => {
			if (!Array.isArray(value)) void action({ target: { value } });
		},
		[action],
	);

	return (
		<AutoComplete
			key={getAutoCompleteKey(value, options)}
			autoFocus={block.focus_on_load}
			value={value}
			onChange={handleChange}
			disabled={loading}
			filter={filter}
			setFilter={setFilter}
			renderSelected={({ selected: { value, label } }) => (
				<Chip height='x20' value={value} marginInlineEnd={4}>
					<RoomAvatar size='x20' room={{ _id: value, ...label, type: label?.type || 'c' }} />
					<Box verticalAlign='middle' is='span' margin='none' marginInline={4}>
						{label.name}
					</Box>
				</Chip>
			)}
			renderItem={({ value, label, ...props }) => (
				<Option
					key={value}
					{...props}
					label={label.name}
					avatar={
						<RoomAvatar
							size='x20'
							room={{
								type: label.type,
								_id: value,
								avatarETag: label.avatarETag,
							}}
							{...props}
						/>
					}
				/>
			)}
			options={options}
		/>
	);
};

export default memo(ChannelsSelectElement);
