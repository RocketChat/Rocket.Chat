import React, { FC, useMemo } from 'react';

import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useCurrentRoute } from '../../../../contexts/RouterContext';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import { ToolboxActionConfig } from '../../lib/Toolbox';
import { ToolboxContext, useToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import RoomHeader, { RoomHeaderProps } from '../RoomHeader';
import BackButton from './BackButton';
import QuickActions from './QuickActions';
import { useQuickActions } from './QuickActions/hooks/useQuickActions';

const OmnichannelRoomHeader: FC<RoomHeaderProps> = ({ slots: parentSlot }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();
	const { visibleActions, getAction } = useQuickActions(room);
	const context = useToolboxContext();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || name === 'omnichannel-directory') && (
				<TemplateHeader.ToolBox>
					{isMobile && <BurgerMenu />}
					{name === 'omnichannel-directory' && <BackButton />}
				</TemplateHeader.ToolBox>
			),
			...(!isMobile && { insideContent: <QuickActions room={room} /> }),
		}),
		[isMobile, name, parentSlot, room],
	);
	return (
		<ToolboxContext.Provider
			value={useMemo(
				() => ({
					...context,
					actions: new Map([
						...(isMobile
							? (visibleActions.map((action) => [
									action.id,
									{
										...action,
										action: (): unknown => getAction(action.id),
										order: (action.order || 0) - 10,
									},
							  ]) as [string, ToolboxActionConfig][])
							: []),
						...(Array.from(context.actions.entries()) as [string, ToolboxActionConfig][]),
					]),
				}),
				[context, isMobile, visibleActions, getAction],
			)}
		>
			<RoomHeader slots={slots} room={room} />
		</ToolboxContext.Provider>
	);
};

export default OmnichannelRoomHeader;
