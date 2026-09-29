import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import { stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-voip';
import type { MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AudioDevicePickerButton from './AudioDevicePickerButton';
import { useCallDeviceSelection, useCallMediaProcessing, useCallState } from './context';
import { useAudioLevel } from './hooks/useAudioLevel';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceGroupsOf, deviceName, isSameDevice, orderAudioDevices } from './lib/deviceLabels';
import { NOISE_METHOD_LABELS, NOISE_METHOD_NOTES } from './lib/mediaChoiceLabels';

const getDefaultDeviceItem = (label: string, type: 'input' | 'output') => ({
	content: (
		<Box is='span' title={label} fontScale='p2'>
			{label}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
	id: `default-${type}`,
});

/** Prefixed ids, so the rows in the menu that are not devices are not mistaken for devices. */
const NOISE_METHOD_PREFIX = 'noise-method:';

/** The microphone and speaker of a call running in this window, with the noise cancelling done to the microphone. */
const AudioDevicePicker = () => {
	const { t } = useTranslation();

	const { self } = useCallState();
	const { devices, selectAudioDevice } = useCallDeviceSelection();
	const { noiseSuppression } = useCallMediaProcessing();

	// A muted mic never moves, whatever it is still hearing.
	const micLevel = useAudioLevel(self.muted ? null : (self.microphoneStream ?? null));

	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	// Which hardware each id belongs to, so the system default's duplicate can be told from a second device that
	// merely shares its name.
	const deviceGroups = useMemo(() => deviceGroupsOf(devices), [devices]);

	// The system default first, wherever the browser happened to put it: it is what will be used if nothing is
	// picked, so it is what should be under the cursor.
	const availableInputDevice = orderAudioDevices(availableDevices?.audioInput ?? [], deviceGroups).map<GenericMenuItemProps>((device) => {
		if (!device.id || !device.label) {
			return getDefaultDeviceItem(t('Default'), 'input');
		}

		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.id}-input`,
			textValue: name,
			content: (
				<Box title={name} fontScale='p2' display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System_default')}
						</Box>
					)}
				</Box>
			),
			// Matched by hardware, not by id: this list keeps the `default` alias while the app's selection is usually
			// the concrete twin of it.
			addon: <RadioButton checked={isSameDevice(device.id, selectedAudioDevices?.audioInput?.id, deviceGroups)} />,
		};
	});

	const availableOutputDevice = orderAudioDevices(availableDevices?.audioOutput ?? [], deviceGroups).map<GenericMenuItemProps>((device) => {
		if (!device.id || !device.label) {
			return getDefaultDeviceItem(t('Default'), 'output');
		}

		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.id}-output`,
			textValue: name,
			content: (
				<Box title={name} fontScale='p2' display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System_default')}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked={isSameDevice(device.id, selectedAudioDevices?.audioOutput?.id, deviceGroups)} />,
			onClick(e?: MouseEvent<HTMLElement>) {
				e?.preventDefault();
				e?.stopPropagation();
			},
		};
	});

	const micSection = {
		title: t('Microphone'),
		items: availableInputDevice,
	};

	const speakerSection = {
		title: t('Speaker'),
		items: availableOutputDevice,
	};

	const disabled = availableOutputDevice.length === 0 && availableInputDevice.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	const requestPermission = useDevicePermissionPrompt2();

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				setIsOpen(false);
				return;
			}

			void requestPermission({
				actionType: 'device-change',
			}).then((stream) => {
				stopTracks(stream);
				setIsOpen(true);
			});
		},
		[requestPermission, setIsOpen],
	);

	// Noise cancelling belongs with the microphone, but not among the microphones: those are a choice of *which* one,
	// and this is what is done to whichever is chosen.
	const noiseItems: GenericMenuItemProps[] = noiseSuppression.methods.map((noiseMethod) => ({
		id: `${NOISE_METHOD_PREFIX}${noiseMethod}`,
		textValue: t(NOISE_METHOD_LABELS[noiseMethod]),
		content: (
			<Box display='flex' flexDirection='column' fontScale='p2' minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(NOISE_METHOD_LABELS[noiseMethod])}
				</Box>
				{NOISE_METHOD_NOTES[noiseMethod] && (
					<Box is='span' fontScale='c1' color='hint'>
						{t(NOISE_METHOD_NOTES[noiseMethod])}
					</Box>
				)}
			</Box>
		),
		addon: <RadioButton checked={noiseSuppression.method === noiseMethod} disabled={noiseSuppression.pending} readOnly />,
	}));

	const noiseSection = { title: t('Noise_cancellation'), items: noiseItems };

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings_lowercase')}
			sections={noiseItems.length ? [micSection, speakerSection, noiseSection] : [micSection, speakerSection]}
			disabled={disabled}
			placement='top-end'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') {
					return;
				}

				if (deviceId.startsWith(NOISE_METHOD_PREFIX)) {
					const method = noiseSuppression.methods.find((method) => `${NOISE_METHOD_PREFIX}${method}` === deviceId);
					if (method) {
						noiseSuppression.select(method);
					}
					return;
				}

				if (deviceId.includes('-input')) {
					const id = deviceId.replace('-input', '');
					// Choosing the device already in use is not a change; putting it through the switch anyway restarts a
					// track that was working.
					if (id === selectedAudioDevices?.audioInput?.id) {
						return;
					}
					const device = availableDevices?.audioInput?.find((device) => device.id === id);
					if (device) {
						selectAudioDevice(device);
					}
					return;
				}

				if (deviceId.includes('-output')) {
					const id = deviceId.replace('-output', '');
					if (id === selectedAudioDevices?.audioOutput?.id) {
						return;
					}
					const device = availableDevices?.audioOutput?.find((device) => device.id === id);
					if (device) {
						selectAudioDevice(device);
					}
					return;
				}

				console.warn('Device Picker - Failed to select device: Invalid deviceId', deviceId);
			}}
			button={<AudioDevicePickerButton level={micLevel} micMuted={self.muted} />}
		/>
	);
};

export default AudioDevicePicker;
