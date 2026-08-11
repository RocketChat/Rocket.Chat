import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type CallDeviceMenuProps = {
	title: string;
	devices: MediaDeviceInfo[];
	selectedId?: string;
	onSelect: (deviceId: string) => void;
	disabled?: boolean;
};

/**
 * Picks which camera or microphone to arrive on, from the preflight.
 *
 * Separate from `ui-voip`'s in-call pickers on purpose: those dispatch through the call's own view context to
 * switch a device mid-call, and there is no call here yet. This one only records a choice for the join to carry.
 *
 * With nothing selected the first entry is marked, because that is what the browser will hand over — showing
 * nothing selected would suggest the choice is open when it isn't.
 */
const CallDeviceMenu = ({ title, devices, selectedId, onSelect, disabled }: CallDeviceMenuProps) => {
	const { t } = useTranslation();

	const items = useMemo(
		(): GenericMenuItemProps[] =>
			devices.map((device, index) => {
				const selected = selectedId ? device.deviceId === selectedId : index === 0;

				return {
					id: device.deviceId,
					// A device the browser hasn't named yet — permission was granted after it was enumerated.
					content: device.label || t('Default'),
					addon: <RadioButton checked={selected} onChange={() => onSelect(device.deviceId)} />,
					onClick: () => onSelect(device.deviceId),
				};
			}),
		[devices, selectedId, onSelect, t],
	);

	return (
		<Box display='flex' alignItems='center'>
			<GenericMenu title={title} icon='chevron-down' small disabled={disabled || !devices.length} items={items} placement='top-start' />
		</Box>
	);
};

export default CallDeviceMenu;
