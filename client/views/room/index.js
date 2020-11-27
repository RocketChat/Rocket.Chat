import React, { Suspense, useMemo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import Header from './Header';
import BlazeTemplate from './components/BlazeTemplate';
import RoomProvider, { useRoom } from './providers/RoomProvider';
import { RoomTemplate } from './components/RoomTemplate';
import { useTab, useTabBarOpen, useTabBarClose } from './providers/ToolboxProvider';
import VerticalBarOldActions from './components/VerticalBarOldActions';

const LazyComponent = ({ template: TabbarTemplate, ...props }) => <Suspense fallback={<div>Loading...</div>}><TabbarTemplate {...props}/></Suspense>;

const Room = () => {
	const t = useTranslation();
	const room = useRoom();
	const tab = useTab();
	const open = useTabBarOpen();
	const close = useTabBarClose();

	const template = !(tab && tab.template);

	const tabBar = useMemo(() => ({ open, close, template }), [open, close, template]);

	return <RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
		<RoomTemplate.Header><Header room={room} rid={room._id}/></RoomTemplate.Header>
		<RoomTemplate.Body><BlazeTemplate name='roomOld' tabBar={tabBar} _id={room._id} /></RoomTemplate.Body>
		{ tab && <RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
			{ typeof template === 'string' && <VerticalBarOldActions {...tab} name={template} tabBar={tabBar} rid={room._id} _id={room._id} /> }
			{ typeof template !== 'string' && <LazyComponent template={template} tabBar={tabBar} rid={room._id} _id={room._id} /> }
		</RoomTemplate.Aside>}
	</RoomTemplate>;
};

export default (props) => <RoomProvider rid={props._id}>
	<Room />
</RoomProvider>;
