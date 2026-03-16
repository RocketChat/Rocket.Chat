import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import DiscussionsList from './DiscussionsList';
import { useDiscussionsList } from './useDiscussionsList';
import { useRoom } from '../../contexts/RoomContext';

const DiscussionListContextBar = () => {
	const userId = useUserId();
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 400);

	const options = useMemo(
		() => ({
			rid: room._id,
			text: debouncedText,
		}),
		[room._id, debouncedText],
	);

	const { isPending, error, data, fetchNextPage } = useDiscussionsList(options);

	const discussions = data?.items || [];
	const totalItemCount = data?.itemCount ?? 0;

	const handleTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setText(e.currentTarget.value);
	}, []);

	if (!userId) {
		return null;
	}

	return (
		<DiscussionsList
			onClose={closeTab}
			error={error}
			discussions={discussions}
			total={totalItemCount}
			loading={isPending}
			loadMoreItems={() => fetchNextPage()}
			text={text}
			onChangeFilter={handleTextChange}
		/>
	);
};

export default DiscussionListContextBar;
