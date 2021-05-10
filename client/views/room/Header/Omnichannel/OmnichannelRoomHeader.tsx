import React, { FC, useMemo } from 'react';

import TemplateHeader from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useCurrentRoute } from '../../../../contexts/RouterContext';
import Burger from '../Burger';
import RoomHeader, { RoomHeaderProps } from '../RoomHeader';
import BackButton from './BackButton';
import QuickActions from './QuickActions';

const OmnichannelRoomHeader: FC<RoomHeaderProps> = ({ room, slots: parentSlot }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || name === 'omnichannel-directory') && (
				<TemplateHeader.ToolBox>
					{isMobile && <Burger />}
					{name === 'omnichannel-directory' && <BackButton />}
				</TemplateHeader.ToolBox>
			),
			insideContent: <QuickActions room={room} />,
		}),
		[isMobile, name, parentSlot, room],
	);
	return <RoomHeader slots={slots} room={room} />;
};

export default OmnichannelRoomHeader;
