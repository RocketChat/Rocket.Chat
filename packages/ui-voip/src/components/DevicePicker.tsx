import { useSelectedDevices } from '@rocket.chat/ui-contexts';
import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceMenu, DeviceSelectionProvider, useMediaDevices } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import DeviceMenuButton from './DeviceMenuButton';
import { useMediaCallView } from '../context/MediaCallViewContext';
import { useDevicePermissionPrompt2, stopTracks } from '../hooks/useDevicePermissionPrompt';

export type DevicePickerProps = { secondary?: boolean };

/** The microphone and speaker of the voice call, chosen through the app's selected devices. */
const DevicePicker = ({ secondary = false }: DevicePickerProps) => {
	const { t } = useTranslation();
	const { onDeviceChange } = useMediaCallView();
	const { devices } = useMediaDevices();
	const selectedDevices = useSelectedDevices();
	const requestPermission = useDevicePermissionPrompt2();

	const selection: DeviceSelection = {
		devices,
		selectedIds: { audioinput: selectedDevices?.audioInput?.id, audiooutput: selectedDevices?.audioOutput?.id },
		select: (kind, deviceId) => {
			const device = devices.find((device) => device.kind === kind && device.deviceId === deviceId);
			if (device) {
				onDeviceChange({ id: device.deviceId, label: device.label, type: device.kind });
			}
		},
	};

	const askForDevices = () => requestPermission({ actionType: 'device-change' }).then(stopTracks);

	return (
		<DeviceSelectionProvider value={selection}>
			<DeviceMenu
				kinds={['audioinput', 'audiooutput']}
				title={t('Device_settings_lowercase')}
				placement='top-end'
				beforeOpen={askForDevices}
				button={<DeviceMenuButton secondary={secondary} tiny={!secondary} label={t('Device_settings_lowercase')} menuIcon='customize' />}
			/>
		</DeviceSelectionProvider>
	);
};

export default DevicePicker;
