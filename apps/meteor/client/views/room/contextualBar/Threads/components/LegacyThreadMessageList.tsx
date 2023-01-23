import type { IMessage } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { isTruthy } from '../../../../../../lib/isTruthy';
import { useBlazePortals } from '../../../../../lib/portals/blazePortals';
import LoadingMessagesIndicator from '../../../components/body/LoadingMessagesIndicator';
import { useLegacyMessageEvents } from '../../../hooks/useLegacyMessageEvents';
import { useLegacyThreadMessageJump } from '../hooks/useLegacyThreadMessageJump';
import { useLegacyThreadMessageListScrolling } from '../hooks/useLegacyThreadMessageListScrolling';
import { useLegacyThreadMessageRef } from '../hooks/useLegacyThreadMessageRef';
import { useLegacyThreadMessages } from '../hooks/useLegacyThreadMessages';

type LegacyThreadMessageListProps = {
	mainMessage: IMessage;
	jumpTo?: string;
	onJumpTo?: (mid: IMessage['_id']) => void;
};

const LegacyThreadMessageList = ({ mainMessage, jumpTo, onJumpTo }: LegacyThreadMessageListProps): ReactElement => {
	const { messages, loading } = useLegacyThreadMessages(mainMessage._id);
	const [portals, portalsSubscription] = useBlazePortals();
	const messageRef = useLegacyThreadMessageRef(portalsSubscription);
	const {
		listWrapperRef: listWrapperScrollRef,
		listRef: listScrollRef,
		onScroll: handleScroll,
		requestScrollToBottom: sendToBottomIfNecessary,
	} = useLegacyThreadMessageListScrolling();
	useLegacyMessageEvents({ messageListRef: listScrollRef, onRequestScrollToBottom: sendToBottomIfNecessary });
	const { parentRef: listJumpRef } = useLegacyThreadMessageJump(jumpTo, { enabled: !loading, onJumpTo });

	const listRef = useMergedRefs<HTMLElement | null>(listScrollRef, listJumpRef);
	const hideUsernames = useUserPreference<boolean>('hideUsernames');

	return (
		<div
			ref={listWrapperScrollRef}
			className={['thread-list js-scroll-thread', hideUsernames && 'hide-usernames'].filter(isTruthy).join(' ')}
			style={{ scrollBehavior: 'smooth' }}
			onScroll={handleScroll}
		>
			<ul ref={listRef} className='thread'>
				{loading ? (
					<li className='load-more'>
						<LoadingMessagesIndicator />
					</li>
				) : (
					<>
						{portals}
						<li key={mainMessage._id} ref={messageRef(mainMessage, -1)} />
						{messages.map((message, index) => (
							<li key={message._id} ref={messageRef(message, index)} />
						))}
					</>
				)}
			</ul>
		</div>
	);
};

export default LegacyThreadMessageList;
