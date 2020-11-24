import React, { Suspense, useState } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import Header from './Header';
import { RocketChatTabBar } from '../../../app/ui-utils/client/lib/RocketChatTabBar';
import BlazeTemplate from './components/BlazeTemplate';
import RoomProvider, { useRoom } from './providers/RoomProvider';
import { RoomTemplate } from './components/RoomTemplate';
import { useTab } from './providers/ToolboxProvider';
import VerticalBarOldActions from './components/VerticalBarOldActions';

const LazyComponent = ({ template: TabbarTemplate, ...props }) => <Suspense fallback={<div>Loading...</div>}><TabbarTemplate {...props}/></Suspense>;

const Room = ({ tabBar }) => {
	const t = useTranslation();
	const room = useRoom();
	const tab = useTab();
	return <RoomTemplate aria-label={t('Channel')} data-qa-rc-room={room._id}>
		<RoomTemplate.Header><Header room={room} tabBar={tabBar} rid={room._id}/></RoomTemplate.Header>
		<RoomTemplate.Body><BlazeTemplate name='roomOld' tabBar={tabBar} _id={room._id} /></RoomTemplate.Body>
		{ tab && <RoomTemplate.Aside data-qa-tabbar-name={tab.id}>
			{ typeof tab.template === 'string' && <VerticalBarOldActions {...tab} name={tab.template} tabBar={tabBar} rid={room._id} _id={room._id} /> }
			{ typeof tab.template !== 'string' && <LazyComponent template={tab.template} tabBar={tabBar} rid={room._id} _id={room._id} /> }
		</RoomTemplate.Aside>}
	</RoomTemplate>;
};

export default (props) => {
	const [tabBar] = useState(new RocketChatTabBar());
	return <RoomProvider tabBar={tabBar} rid={props._id}>
		<Room tabBar={tabBar}/>
	</RoomProvider>;
};
