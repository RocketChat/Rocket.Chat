import type { Box } from '@rocket.chat/fuselage';
import { useStableArray } from '@rocket.chat/fuselage-hooks';
import { HeaderToolbarAction } from '@rocket.chat/ui-client';
import { useRoomToolbox, type RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { roomActionHooksForE2EESetup } from '../../../../ui';

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
