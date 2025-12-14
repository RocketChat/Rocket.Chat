import type { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox, type RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbarAction } from '../../../../components/Header';
import { roomActionHooksForE2EESetup } from '../../../../ui';
import { useRoom } from '../../contexts/RoomContext';
import { getRoomGroup } from '../../lib/getRoomGroup';

type RoomToolboxE2EESetupProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const RoomToolboxE2EESetup = ({ className }: RoomToolboxE2EESetupProps) => {
	const { t } = useTranslation();
	const toolbox = useRoomToolbox();
	const room = useRoom();

	const { tab } = toolbox;

	const actions = useStableArray(
		roomActionHooksForE2EESetup
			.map((roomActionHook) => roomActionHook())
			.filter(
				(roomAction): roomAction is RoomToolboxActionConfig =>
					!!roomAction && (!roomAction.groups || roomAction.groups.includes(getRoomGroup(room))),
			),
	);

	return (
		<>
			{actions.map(({ id, icon, title, action, disabled, tooltip }) => (
				<HeaderToolbarAction
					key={id}
					className={className}
					id={id}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					onClick={action ?? (() => toolbox.openTab(id))}
					disabled={disabled}
					tooltip={tooltip}
				/>
			))}
		</>
	);
};

export default RoomToolboxE2EESetup;
