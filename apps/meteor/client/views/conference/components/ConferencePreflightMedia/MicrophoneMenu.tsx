import {
	NOISE_METHOD_LABELS,
	NOISE_METHOD_NOTES,
	choicesOf,
	useCallDevicesInitialState,
	useNoiseSuppressionPreference,
} from '@rocket.chat/ui-conference';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import DeviceMenuOption from '../DeviceMenu/DeviceMenuOption';
import DeviceMenuSection from '../DeviceMenu/DeviceMenuSection';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

/** Which microphone to arrive on, and the noise cancelling done to it. */
const MicrophoneMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);
	const { noiseMethod, selectNoiseMethod } = useNoiseSuppressionPreference();

	const rows = useMemo(() => deviceMenuRows(preview.audioInputs), [preview.audioInputs]);
	const selected = selectedDevice(rows, devices.micId);

	return (
		<DeviceMenu icon='mic' label={t('Microphone')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('mic', deviceId)} />
			<DeviceMenuSection title={t('Noise_cancellation')}>
				{choicesOf(NOISE_METHOD_LABELS).map((method) => {
					const note = NOISE_METHOD_NOTES[method];
					return (
						<DeviceMenuOption
							key={method}
							name={t(NOISE_METHOD_LABELS[method])}
							note={note && t(note)}
							selected={method === noiseMethod}
							onSelect={() => selectNoiseMethod(method)}
						/>
					);
				})}
			</DeviceMenuSection>
		</DeviceMenu>
	);
};

export default MicrophoneMenu;
