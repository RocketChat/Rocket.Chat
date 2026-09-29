import { useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

/** Which speaker to arrive on. */
const SpeakerMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);

	const rows = useMemo(() => deviceMenuRows(preview.audioOutputs), [preview.audioOutputs]);
	const selected = selectedDevice(rows, devices.speakerId);

	return (
		<DeviceMenu icon='volume' label={t('Speaker')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('speaker', deviceId)} />
		</DeviceMenu>
	);
};

export default SpeakerMenu;
