import React, { FC, useMemo } from 'react';

import TemplateHeader from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useCurrentRoute } from '../../../../contexts/RouterContext';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import { ToolboxActionConfig } from '../../lib/Toolbox';
import { ToolboxContext, useToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import Burger from '../Burger';
import RoomHeader, { RoomHeaderProps } from '../RoomHeader';
import BackButton from './BackButton';
import QuickActions from './QuickActions';
import { useQuickActions } from './QuickActions/hooks/useQuickActions';

const OmnichannelRoomHeader: FC<RoomHeaderProps> = ({ slots: parentSlot }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();
	const [visible] = useQuickActions(room);
	const context = useToolboxContext();

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
	return (
		<ToolboxContext.Provider
			value={useMemo(
				() => ({
					...context,
					actions: new Map([
						...Object.entries(context.actions),
						...(visible.map((action) => [action.id, action]) as [string, ToolboxActionConfig][]),
					]),
				}),
				[context, visible],
			)}
		>
			<RoomHeader slots={slots} room={room} />
		</ToolboxContext.Provider>
	);
};

export default OmnichannelRoomHeader;
