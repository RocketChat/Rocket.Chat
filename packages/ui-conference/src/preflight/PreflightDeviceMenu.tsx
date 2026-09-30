import { Box } from '@rocket.chat/fuselage';

import PreflightDeviceMenuButton from './PreflightDeviceMenuButton';
import DeviceMenu from '../devices/DeviceMenu';
import { useDeviceSelection } from '../devices/DeviceSelectionContext';
import { deviceMenuSelection } from '../devices/deviceMenuRows';

export type PreflightDeviceMenuProps = {
	kind: MediaDeviceKind;
	label: string;
};

/** Which device of one kind to arrive on, named on the trigger. */
const PreflightDeviceMenu = ({ kind, label }: PreflightDeviceMenuProps) => {
	const { selected } = deviceMenuSelection(useDeviceSelection(), kind);

	return (
		<Box display='flex' alignItems='center' minWidth={0}>
			<DeviceMenu
				kinds={[kind]}
				title={label}
				placement='top-start'
				button={<PreflightDeviceMenuButton kind={kind} label={label} current={selected?.name} />}
			/>
		</Box>
	);
};

export default PreflightDeviceMenu;
