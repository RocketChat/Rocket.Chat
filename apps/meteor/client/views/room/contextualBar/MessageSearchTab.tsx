import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBarClose from '../../../components/VerticalBar/VerticalBarClose';
import VerticalBarContent from '../../../components/VerticalBar/VerticalBarContent';
import VerticalBarHeader from '../../../components/VerticalBar/VerticalBarHeader';
import VerticalBarIcon from '../../../components/VerticalBar/VerticalBarIcon';
import VerticalBarText from '../../../components/VerticalBar/VerticalBarText';
import BlazeTemplate from '../components/BlazeTemplate';
import { useRoom } from '../contexts/RoomContext';
import { useToolboxContext } from '../contexts/ToolboxContext';

const MessageSearchTab = () => {
	const room = useRoom();
	const toolbox = useToolboxContext();

	const t = useTranslation();

	return (
		<>
			<VerticalBarHeader>
				{'magnifier' && <VerticalBarIcon name='magnifier' />}
				<VerticalBarText>{t('Search_Messages')}</VerticalBarText>
				{close && <VerticalBarClose onClick={close} />}
			</VerticalBarHeader>
			<VerticalBarContent flexShrink={1} flexGrow={1}>
				<BlazeTemplate flexShrink={1} overflow='hidden' name='RocketSearch' tabBar={toolbox} rid={room._id} />
			</VerticalBarContent>
		</>
	);
};

export default MessageSearchTab;
