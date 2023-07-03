import type { IVoipRoom } from '@rocket.chat/core-typings';
import { HeaderToolbox } from '@rocket.chat/ui-client';
import { useLayout, useCurrentRoute } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import BurgerMenu from '../../../../components/BurgerMenu';
import { ToolboxContext, useToolboxContext } from '../../contexts/ToolboxContext';
import type { ToolboxActionConfig } from '../../lib/Toolbox';
import type { RoomHeaderProps } from '../RoomHeader';
import RoomHeader from '../RoomHeader';
import { BackButton } from './BackButton';

type VoipRoomHeaderProps = {
	room: IVoipRoom;
} & Omit<RoomHeaderProps, 'room'>;

const VoipRoomHeader: FC<VoipRoomHeaderProps> = ({ slots: parentSlot, room }) => {
	const [name] = useCurrentRoute();
	const { isMobile } = useLayout();
	const toolbox = useToolboxContext();

	const slots = useMemo(
		() => ({
			...parentSlot,
			start: (!!isMobile || name === 'omnichannel-directory') && (
				<HeaderToolbox>
					{isMobile && <BurgerMenu />}
					{name === 'omnichannel-directory' && <BackButton />}
				</HeaderToolbox>
			),
		}),
		[isMobile, name, parentSlot],
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
			<RoomHeader slots={slots} room={{ ...room, name: parseOutboundPhoneNumber(room.fname) }} />
		</ToolboxContext.Provider>
	);
};

export default VoipRoomHeader;
