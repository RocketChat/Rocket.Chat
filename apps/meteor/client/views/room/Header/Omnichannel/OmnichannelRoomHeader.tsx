import { Header as TemplateHeader } from '@rocket.chat/ui-client';
import { useLayout, useCurrentRoute } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import BurgerMenu from '../../../../components/BurgerMenu';
import { useOmnichannelRoom } from '../../contexts/RoomContext';
import { ToolboxContext, useToolboxContext } from '../../contexts/ToolboxContext';
import type { ToolboxActionConfig } from '../../lib/Toolbox';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';
import QuickActions from './QuickActions';

type OmnichannelRoomHeaderProps = {
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const OmnichannelRoomHeader: FC<OmnichannelRoomHeaderProps> = ({ slots: parentSlot }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const room = useOmnichannelRoom();
	const toolbox = useToolboxContext();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || name === 'omnichannel-directory' || name === 'omnichannel-current-chats') && (
				<TemplateHeader.ToolBox>
					{isMobile && <BurgerMenu />}
					{<BackButton routeName={name} />}
				</TemplateHeader.ToolBox>
			),
			posContent: <QuickActions room={room} />,
		}),
		[isMobile, name, parentSlot, room],
	);
	return (
		<ToolboxContext.Provider
			value={useMemo(
				() => ({
					...toolbox,
					actions: new Map([...(Array.from(toolbox.actions.entries()) as [string, ToolboxActionConfig][])]),
				}),
				[toolbox],
			)}
		>
			<RoomHeader slots={slots} room={room} />
		</ToolboxContext.Provider>
	);
};

export default OmnichannelRoomHeader;
