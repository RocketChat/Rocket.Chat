import type { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbarAction } from '../../../../components/Header';
import { roomActionHooksForE2EESetup } from '../../../../ui';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type RoomToolboxE2EESetupProps = {
	className?: ComponentProps<typeof Box>['className'];
};

const RoomToolboxE2EESetup = ({ className }: RoomToolboxE2EESetupProps) => {
	const { t } = useTranslation();
	const toolbox = useRoomToolbox();

	const { tab } = toolbox;

	const actions = useStableArray(
		roomActionHooksForE2EESetup
			.map((roomActionHook) => roomActionHook())
			.filter((roomAction): roomAction is RoomToolboxActionConfig => !!roomAction),
	);

	return (
		<>
			{actions.map(({ id, icon, title, action, disabled, tooltip }, index) => (
				<HeaderToolbarAction
					key={id}
					className={className}
					index={index}
					id={id}
					icon={icon}
					title={t(title)}
					pressed={id === tab?.id}
					action={action ?? (() => toolbox.openTab(id))}
					disabled={disabled}
					tooltip={tooltip}
				/>
			))}
		</>
	);
};

export default RoomToolboxE2EESetup;
