import React, { Suspense, useMemo, FC } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../contexts/TranslationContext';
import Header from './Header';
import BlazeTemplate from './components/BlazeTemplate';
import { useUserPreference } from '../../contexts/UserContext';
import RoomProvider, { useRoom } from './providers/RoomProvider';
import { RoomTemplate } from './components/RoomTemplate';
import { useTab, useTabBarOpen, useTabBarClose, useTabBarOpenUserInfo } from './providers/ToolboxProvider';
import VerticalBarOldActions from './components/VerticalBarOldActions';
import VerticalBar from '../../components/VerticalBar';
import { IRoom } from '../../../definition/IRoom';
import { MessageList } from './MessageList';
import Announcement from './Announcement';
import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';

const LazyComponent: FC<{ template: FC }> = ({ template: TabbarTemplate, ...props }) => <Suspense fallback={<VerticalBar.Skeleton/>}><TabbarTemplate {...props}/></Suspense>;

const Room: FC<{ room: IRoom }> = ({ room }) => {
	const t = useTranslation();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();
	const openUserInfo = useTabBarOpenUserInfo();
	const isLayoutEmbedded = useEmbeddedLayout();

	const hideFlexTab = useUserPreference('hideFlexTab');
	const isOpen = useMutableCallback(() => !!(tab && tab.template));

	const tabBar = useMemo(() => ({ open, close, isOpen, openUserInfo }), [open, close, isOpen, openUserInfo]);

	return <RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
		<RoomTemplate.Header><Header room={room} rid={room._id}/></RoomTemplate.Header>
		<RoomTemplate.Body>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement}/>}
			<MessageList />
			<BlazeTemplate onClick={hideFlexTab ? close : undefined} name='roomOld' tabBar={tabBar} rid={room._id} _id={room._id} />
		</RoomTemplate.Body>
		{ tab && <RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
			{ typeof tab.template === 'string' && <VerticalBarOldActions {...tab} name={tab.template} tabBar={tabBar} rid={room._id} _id={room._id} /> }
			{ typeof tab.template !== 'string' && <LazyComponent template={tab.template} tabBar={tabBar} rid={room._id} teamId={room.teamId} _id={room._id} /> }
		</RoomTemplate.Aside>}
	</RoomTemplate>;
};


const RoomSkeleton: FC = () => {
	return <>Loading</>;
};

const RoomRouter: FC = () => {
	const room = useRoom();
	if (!room) {
		return <RoomSkeleton/>;
	}
	return <Room room={room}/>;
};

const Provider: FC<{_id: IRoom['_id']}> = (props) => <RoomProvider rid={props._id}>
	<RoomRouter />
</RoomProvider>;

export default Provider;
