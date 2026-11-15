import { Box } from '@rocket.chat/fuselage';
import type { DeviceMenuChoices } from '@rocket.chat/ui-media';
import { DeviceMenu, deviceMenuSelection, useDeviceSelection } from '@rocket.chat/ui-media';

import PreflightDeviceMenuButton from './PreflightDeviceMenuButton';

export type PreflightDeviceMenuProps = {
	kind: MediaDeviceKind;
	label: string;
	/** Choices about the device, under it. */
	choices?: DeviceMenuChoices[];
};

/** Which device of one kind to arrive on, named on the trigger, and what is done to it. */
const PreflightDeviceMenu = ({ kind, label, choices }: PreflightDeviceMenuProps) => {
	const { selected } = deviceMenuSelection(useDeviceSelection(), kind);

	return (
		<Box display='flex' alignItems='center' minWidth={0}>
			<DeviceMenu
				kinds={[kind]}
				title={label}
				placement='top-start'
				choices={choices}
				button={<PreflightDeviceMenuButton kind={kind} label={label} current={selected?.name} />}
			/>
		</Box>
	);
};

export default PreflightDeviceMenu;
