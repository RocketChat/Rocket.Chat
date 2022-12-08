import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Modal } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useLayoutContextualBarExpanded, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { useMemo, useCallback } from 'react';

import { normalizeThreadTitle } from '../../../../../app/threads/client/lib/normalizeThreadTitle';
import VerticalBar from '../../../../components/VerticalBar';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import ChatProvider from '../../providers/ChatProvider';
import MessageProvider from '../../providers/MessageProvider';
import ThreadSkeleton from './components/ThreadSkeleton';
import ThreadView from './components/ThreadView';
import { useGoToThreadList } from './hooks/useGoToThreadList';
import { useThreadMessage } from './hooks/useThreadMessage';

type ThreadProps = {
	tmid: IMessage['_id'];
};

const Thread = ({ tmid }: ThreadProps): ReactElement => {
	const room = useRoom();
	const subscription = useRoomSubscription();

	const goToThreadList = useGoToThreadList();
	const handleGoBack = () => {
		goToThreadList();
	};

	const canExpand = useLayoutContextualBarExpanded();
	const [expanded, setExpanded] = useLocalStorage('expand-threads', false);

	const handleToggleExpand = useCallback(() => {
		setExpanded((expanded) => !expanded);
	}, [setExpanded]);

	const mainMessage = useThreadMessage(tmid);
	const title = useMemo(
		(): ReactNode => (mainMessage ? <VerticalBar.Text dangerouslySetInnerHTML={{ __html: normalizeThreadTitle(mainMessage) }} /> : null),
		[mainMessage],
	);

	const uid = useUserId();
	const following = !uid ? false : mainMessage?.replies?.includes(uid) ?? false;

	const followMessage = useEndpoint('POST', '/v1/chat.followMessage');
	const unfollowMessage = useEndpoint('POST', '/v1/chat.unfollowMessage');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleToggleFollowing = useCallback<() => void>(async () => {
		try {
			if (!following) {
				await followMessage({ mid: tmid });
				return;
			}

			await unfollowMessage({ mid: tmid });
		} catch (error: unknown) {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		}
	}, [dispatchToastMessage, followMessage, following, tmid, unfollowMessage]);

	const closeTabBar = useTabBarClose();

	const handleBackdropClick = useCallback(() => {
		closeTabBar();
	}, [closeTabBar]);

	const handleClose = useCallback(() => {
		closeTabBar();
	}, [closeTabBar]);

	return (
		<VerticalBar.InnerContent>
			{canExpand && expanded && <Modal.Backdrop onClick={handleBackdropClick} />}
			<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
				<ChatProvider tmid={tmid}>
					<MessageProvider rid={room._id} broadcast={subscription?.broadcast ?? false}>
						{mainMessage ? (
							<ThreadView
								tmid={tmid}
								onGoBack={handleGoBack}
								canExpand={canExpand}
								expanded={expanded}
								onToggleExpand={handleToggleExpand}
								title={title}
								following={following}
								onToggleFollowing={handleToggleFollowing}
								onClose={handleClose}
							/>
						) : (
							<ThreadSkeleton />
						)}
					</MessageProvider>
				</ChatProvider>
			</Box>
		</VerticalBar.InnerContent>
	);
};

export default Thread;
