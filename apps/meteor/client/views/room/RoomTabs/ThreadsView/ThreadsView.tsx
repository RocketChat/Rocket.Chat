import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';

import ThreadsViewList from './ThreadsViewList';
import ThreadsViewThread from './ThreadsViewThread';
import MediaCallRoom from '../../body/MediaCallRoom';
import RoomBody from '../../body/RoomBody';
import { OpenThreadContext } from '../../contexts/OpenThreadContext';
import { SelectedMessagesProvider } from '../../providers/SelectedMessagesProvider';
import { useThreadsTabThread } from '../hooks/useActiveRoomTab';
import { useGoToChatTab } from '../hooks/useGoToChatTab';
import { useGoToThreadsTab } from '../hooks/useGoToThreadsTab';

const ThreadsView = () => {
	const { isMobile } = useLayout();
	const tmid = useThreadsTabThread();
	const goToThreadsTab = useGoToThreadsTab();
	const goToChatTab = useGoToChatTab();

	const openThreadInList = useStableCallback((tmid: IMessage['_id'], msg?: IMessage['_id']) => goToThreadsTab({ tmid, msg }));

	// On mobile only one side shows, and the room's own conversation is already the Chat tab.
	const handleMainRoomClick = isMobile ? goToChatTab : () => goToThreadsTab();

	const showList = !isMobile || !tmid;
	const showPane = !isMobile || !!tmid;

	return (
		<Box display='flex' flexGrow={1} minHeight={0} overflow='hidden'>
			{showList && (
				<Box
					display='flex'
					flexShrink={0}
					width={isMobile ? 'full' : 'x320'}
					borderInlineEndWidth='default'
					borderInlineEndStyle='solid'
					borderInlineEndColor='stroke-extra-light'
				>
					<ThreadsViewList selectedTmid={tmid} mainRoomSelected={!isMobile && !tmid} onMainRoomClick={handleMainRoomClick} />
				</Box>
			)}
			{showPane && (
				<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0}>
					{tmid ? (
						<SelectedMessagesProvider>
							<ThreadsViewThread key={tmid} tmid={tmid} />
						</SelectedMessagesProvider>
					) : (
						<OpenThreadContext.Provider value={openThreadInList}>
							<MediaCallRoom>
								<RoomBody />
							</MediaCallRoom>
						</OpenThreadContext.Provider>
					)}
				</Box>
			)}
		</Box>
	);
};

export default ThreadsView;
