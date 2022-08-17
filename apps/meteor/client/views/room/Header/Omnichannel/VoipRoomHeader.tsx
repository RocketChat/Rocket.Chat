import { IVoipRoom } from '@rocket.chat/core-typings';
import { useLayout, useCurrentRoute } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import { ToolboxActionConfig } from '../../lib/Toolbox';
import { ToolboxContext, useToolboxContext } from '../../lib/Toolbox/ToolboxContext';
import RoomHeader, { RoomHeaderProps } from '../RoomHeader';
import { BackButton } from './BackButton';

export type VoipRoomHeaderProps = {
	room: IVoipRoom;
} & Omit<RoomHeaderProps, 'room'>;

const VoipRoomHeader: FC<VoipRoomHeaderProps> = ({ slots: parentSlot, room }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
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
		}),
		[isMobile, name, parentSlot],
	);
	return (
		<ToolboxContext.Provider
			value={useMemo(
				() => ({
					...context,
					actions: new Map([...(Array.from(context.actions.entries()) as [string, ToolboxActionConfig][])]),
				}),
				[context],
			)}
		>
			<RoomHeader slots={slots} room={{ ...room, name: parseOutboundPhoneNumber(room.fname) }} />
		</ToolboxContext.Provider>
	);
};

export default VoipRoomHeader;
