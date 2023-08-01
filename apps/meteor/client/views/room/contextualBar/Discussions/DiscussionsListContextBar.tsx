import type { IDiscussionMessage, IRoom } from '@rocket.chat/core-typings';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import DiscussionsList from './DiscussionsList';
import { useDiscussionsList } from './useDiscussionsList';

const DiscussionListContextBar = ({ rid }: { rid: IRoom['_id'] }): ReactElement | null => {
	const userId = useUserId();
	const { closeTab } = useRoomToolbox();

	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 400);

	const options = useMemo(
		() => ({
			rid,
			text: debouncedText,
		}),
		[rid, debouncedText],
	);

	const { discussionsList, loadMoreItems } = useDiscussionsList(options, userId);
	const { phase, error, items: discussions, itemCount: totalItemCount } = useRecordList<IDiscussionMessage>(discussionsList);

	const handleTextChange = useCallback((e) => {
		setText(e.currentTarget.value);
	}, []);

	if (!userId) {
		return null;
	}

	return (
		<DiscussionsList
			onClose={closeTab}
			userId={userId}
			error={error}
			discussions={discussions}
			total={totalItemCount}
			loading={phase === AsyncStatePhase.LOADING}
			loadMoreItems={loadMoreItems}
			text={text}
			onChangeFilter={handleTextChange}
		/>
	);
};

export default DiscussionListContextBar;
