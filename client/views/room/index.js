import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { Suspense, useMemo } from 'react';

import VerticalBar from '../../components/VerticalBar';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import Header from './Header';
import BlazeTemplate from './components/BlazeTemplate';
import { RoomTemplate } from './components/RoomTemplate';
import VerticalBarOldActions from './components/VerticalBarOldActions';
import RoomProvider, { useRoom } from './providers/RoomProvider';
import {
	useTab,
	useTabBarOpen,
	useTabBarClose,
	useTabBarOpenUserInfo,
} from './providers/ToolboxProvider';

const LazyComponent = ({ template: TabbarTemplate, ...props }) => (
	<Suspense fallback={<VerticalBar.Skeleton />}>
		<TabbarTemplate {...props} />
	</Suspense>
);

const Room = () => {
	const t = useTranslation();
	const room = useRoom();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();
	const openUserInfo = useTabBarOpenUserInfo();

	const hideFlexTab = useUserPreference('hideFlexTab');
	const isOpen = useMutableCallback(() => !!(tab && tab.template));

	const tabBar = useMemo(() => ({ open, close, isOpen, openUserInfo }), [
		open,
		close,
		isOpen,
		openUserInfo,
	]);

	return (
		<RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
			<RoomTemplate.Header>
				<Header room={room} rid={room._id} />
			</RoomTemplate.Header>
			<RoomTemplate.Body>
				<BlazeTemplate
					onClick={hideFlexTab ? close : undefined}
					name='roomOld'
					tabBar={tabBar}
					rid={room._id}
					_id={room._id}
				/>
			</RoomTemplate.Body>
			{tab && (
				<RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
					{typeof tab.template === 'string' && (
						<VerticalBarOldActions
							{...tab}
							name={tab.template}
							tabBar={tabBar}
							rid={room._id}
							_id={room._id}
						/>
					)}
					{typeof tab.template !== 'string' && (
						<LazyComponent
							template={tab.template}
							tabBar={tabBar}
							rid={room._id}
							teamId={room.teamId}
							_id={room._id}
						/>
					)}
				</RoomTemplate.Aside>
			)}
		</RoomTemplate>
	);
};

export default (props) => (
	<RoomProvider rid={props._id}>
		<Room />
	</RoomProvider>
);

function Body({ children }) {
	return children;
}

function Footer({ children }) {
	return children;
}

function Aside({ children }) {
	return children;
}

Room.Header = Header;
Room.Body = Body;
Room.Footer = Footer;
Room.Aside = Aside;
