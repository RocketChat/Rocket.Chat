import { Badge, Box, Icon, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useActiveRoomTab } from './hooks/useActiveRoomTab';
import { useGoToChatTab } from './hooks/useGoToChatTab';
import { useGoToThreadsTab } from './hooks/useGoToThreadsTab';
import { useThreadsUnreadBadge } from '../hooks/useThreadsUnreadBadge';

const RoomTabs = () => {
	const { t } = useTranslation();
	const activeTab = useActiveRoomTab();
	const goToChatTab = useGoToChatTab();
	const goToThreadsTab = useGoToThreadsTab();
	const threadsUnreadBadge = useThreadsUnreadBadge();

	return (
		<Tabs flexShrink={0}>
			<TabsItem selected={activeTab === 'chat'} onClick={activeTab === 'chat' ? undefined : goToChatTab}>
				<Box is='span' display='flex' alignItems='center'>
					<Icon name='balloon' size='x20' marginInlineEnd={8} />
					{t('Chat')}
				</Box>
			</TabsItem>
			<TabsItem selected={activeTab === 'threads'} onClick={activeTab === 'threads' ? undefined : () => goToThreadsTab()}>
				<Box is='span' display='flex' alignItems='center'>
					<Icon name='thread' size='x20' marginInlineEnd={8} />
					{t('Threads')}
					{threadsUnreadBadge && (
						<Box is='span' marginInlineStart={8}>
							<Badge variant={threadsUnreadBadge.variant}>{threadsUnreadBadge.label}</Badge>
						</Box>
					)}
				</Box>
			</TabsItem>
		</Tabs>
	);
};

export default RoomTabs;
