import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { HeaderToolbar } from '../../../../components/Header';
import SidebarToggler from '../../../../components/SidebarToggler';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';
import OmnichannelRoomHeaderTag from './OmnichannelRoomHeaderTag';
import QuickActions from './QuickActions';

type OmnichannelRoomHeaderProps = {
	slots: {
		start?: ReactNode;
		preContent?: ReactNode;
		insideContent?: ReactNode;
		posContent?: ReactNode;
		end?: ReactNode;
		toolbox?: {
			pre?: ReactNode;
			content?: ReactNode;
			pos?: ReactNode;
		};
	};
};

const OmnichannelRoomHeader = ({ slots: parentSlot }: OmnichannelRoomHeaderProps) => {
	const router = useRouter();

	const previousRouteName = useSyncExternalStore(
		router.subscribeToRouteChange,
		useCallback(() => router.getPreviousRouteName(), [router]),
	);

	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || previousRouteName === 'omnichannel-directory' || previousRouteName === 'omnichannel-current-chats') && (
				<HeaderToolbar>
					{isMobile && <SidebarToggler />}
					<BackButton routeName={previousRouteName} />
				</HeaderToolbar>
			),
			insideContent: <OmnichannelRoomHeaderTag />,
			posContent: <QuickActions />,
		}),
		[parentSlot, isMobile, previousRouteName],
	);

	return <RoomHeader slots={slots} room={room} />;
};

export default OmnichannelRoomHeader;
