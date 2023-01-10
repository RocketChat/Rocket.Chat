import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Modal, Skeleton } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useLayoutContextualBarExpanded, useToastMessageDispatch, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import VerticalBarAction from '../../../../components/VerticalBar/VerticalBarAction';
import VerticalBarActions from '../../../../components/VerticalBar/VerticalBarActions';
import VerticalBarClose from '../../../../components/VerticalBar/VerticalBarClose';
import VerticalBarHeader from '../../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarInnerContent from '../../../../components/VerticalBar/VerticalBarInnerContent';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import ChatProvider from '../../providers/ChatProvider';
import MessageProvider from '../../providers/MessageProvider';
import ThreadChat from './components/ThreadChat';
import ThreadSkeleton from './components/ThreadSkeleton';
import ThreadTitle from './components/ThreadTitle';
import { useGoToThreadList } from './hooks/useGoToThreadList';
import { useThreadMainMessageQuery } from './hooks/useThreadMainMessageQuery';
import { useToggleFollowingThreadMutation } from './hooks/useToggleFollowingThreadMutation';

type ThreadProps = {
	tmid: IMessage['_id'];
};

const Thread: VFC<ThreadProps> = ({ tmid }) => {
	const goToThreadList = useGoToThreadList();
	const closeTabBar = useTabBarClose();

	const mainMessageQueryResult = useThreadMainMessageQuery(tmid, {
		onDelete: () => {
			closeTabBar();
		},
	});

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canExpand = useLayoutContextualBarExpanded();
	const [expanded, setExpanded] = useLocalStorage('expand-threads', false);

	const uid = useUserId();
	const following = uid ? mainMessageQueryResult.data?.replies?.includes(uid) ?? false : false;
	const toggleFollowingMutation = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleBackdropClick = () => {
		closeTabBar();
	};

	const handleGoBack = () => {
		goToThreadList();
	};

	const handleToggleExpand = () => {
		setExpanded((expanded) => !expanded);
	};

	const handleToggleFollowing = () => {
		toggleFollowingMutation.mutate({ tmid, follow: !following });
	};

	const handleClose = () => {
		closeTabBar();
	};

	return (
		<VerticalBarInnerContent>
			{canExpand && expanded && <Modal.Backdrop onClick={handleBackdropClick} />}
			<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
				<VerticalBar
					rcx-thread-view
					className={
						canExpand && expanded
							? css`
									max-width: 855px !important;
									@media (min-width: 780px) and (max-width: 1135px) {
										max-width: calc(100% - var(--sidebar-width)) !important;
									}
							  `
							: undefined
					}
					position={expanded ? 'fixed' : 'absolute'}
					display='flex'
					flexDirection='column'
					width='full'
					overflow='hidden'
					zIndex={100}
					insetBlock={0}
					border='none'
				>
					<VerticalBarHeader expanded={expanded}>
						<VerticalBarAction name='arrow-back' title={t('Back_to_threads')} onClick={handleGoBack} />
						{(mainMessageQueryResult.isLoading && <Skeleton width='100%' />) ||
							(mainMessageQueryResult.isSuccess && <ThreadTitle mainMessage={mainMessageQueryResult.data} />) ||
							null}
						<VerticalBarActions>
							{canExpand && (
								<VerticalBarAction
									name={expanded ? 'arrow-collapse' : 'arrow-expand'}
									title={expanded ? t('Collapse') : t('Expand')}
									onClick={handleToggleExpand}
								/>
							)}
							<VerticalBarAction
								name={following ? 'bell' : 'bell-off'}
								title={following ? t('Following') : t('Not_Following')}
								disabled={!mainMessageQueryResult.isSuccess || toggleFollowingMutation.isLoading}
								onClick={handleToggleFollowing}
							/>
							<VerticalBarClose onClick={handleClose} />
						</VerticalBarActions>
					</VerticalBarHeader>

					{(mainMessageQueryResult.isLoading && <ThreadSkeleton />) ||
						(mainMessageQueryResult.isSuccess && (
							<ChatProvider tmid={tmid}>
								<MessageProvider>
									<ThreadChat mainMessage={mainMessageQueryResult.data} />
								</MessageProvider>
							</ChatProvider>
						)) ||
						null}
				</VerticalBar>
			</Box>
		</VerticalBarInnerContent>
	);
};

export default Thread;
