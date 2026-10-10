import type { IMessage } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useLayout, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ThreadChat from '../../contextualBar/Threads/components/ThreadChat';
import ThreadSkeleton from '../../contextualBar/Threads/components/ThreadSkeleton';
import { useThreadMainMessageQuery } from '../../contextualBar/Threads/hooks/useThreadMainMessageQuery';
import { useToggleFollowingThreadMutation } from '../../contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import ChatProvider from '../../providers/ChatProvider';
import { useGoToThreadsTab } from '../hooks/useGoToThreadsTab';

export type ThreadsViewThreadProps = {
	tmid: IMessage['_id'];
};

const ThreadsViewThread = ({ tmid }: ThreadsViewThreadProps) => {
	const { t } = useTranslation();
	const { isMobile } = useLayout();
	const uid = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const goToThreadsTab = useGoToThreadsTab({ replace: true });
	const goToThreadList = () => goToThreadsTab();

	const mainMessageQueryResult = useThreadMainMessageQuery(tmid, {
		onDelete: () => {
			goToThreadList();
		},
	});
	const mainMessage = mainMessageQueryResult.data;

	const following = uid ? (mainMessage?.replies?.includes(uid) ?? false) : false;
	const toggleFollowingMutation = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleToggleFollowing = () => {
		if (!mainMessage) {
			return;
		}

		toggleFollowingMutation.mutate({ rid: mainMessage.rid, tmid, follow: !following });
	};

	return (
		<Box is='section' aria-label={t('Thread')} display='flex' flexDirection='column' flexGrow={1} minWidth={0} minHeight={0}>
			<Box
				display='flex'
				alignItems='center'
				flexShrink={0}
				height='x48'
				paddingInline={16}
				borderBlockEndWidth='default'
				borderBlockEndStyle='solid'
				borderBlockEndColor='stroke-extra-light'
			>
				{isMobile && <IconButton small icon='arrow-back' title={t('Back')} onClick={goToThreadList} marginInlineEnd={8} />}
				<Icon name='thread' size='x20' marginInlineEnd={8} />
				<Box is='h2' fontScale='h4' color='titles-labels'>
					{t('Thread')}
				</Box>
				{mainMessage && (
					<Box fontScale='p2' color='hint' marginInlineStart={8} withTruncatedText>
						{t('__count__replies', { count: mainMessage.tcount ?? 0 })}
					</Box>
				)}
				<Box flexGrow={1} />
				<IconButton
					small
					icon={following ? 'bell' : 'bell-off'}
					title={following ? t('Following') : t('Not_Following')}
					pressed={following}
					disabled={!mainMessage || toggleFollowingMutation.isPending}
					onClick={handleToggleFollowing}
				/>
			</Box>
			{(mainMessageQueryResult.isLoading && <ThreadSkeleton />) ||
				(mainMessage && (
					<ChatProvider tmid={tmid}>
						<ThreadChat mainMessage={mainMessage} onEscape={goToThreadList} />
					</ChatProvider>
				)) ||
				null}
		</Box>
	);
};

export default ThreadsViewThread;
