import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import { ActionButton, stopTracks, useDevicePermissionPrompt2 } from '@rocket.chat/ui-voip';
import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import VoiceActivity from './VoiceActivity';
import { useCallDeviceSelection, useCallMediaProcessing, useCallState } from './context';
import { useAudioLevel } from './hooks/useAudioLevel';
import { useMediaDevices } from './hooks/useMediaDevices';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceGroupsOf, deviceName, isSameDevice, orderAudioDevices } from './lib/deviceLabels';
import { NOISE_METHOD_LABELS, NOISE_METHOD_NOTES } from './lib/mediaChoiceLabels';

type AudioDevicePickerButtonProps = {
	small?: boolean;
	/** How loud the microphone is hearing, from 0 to 1. Shown in place of the chevron. */
	level: number;
	/** Whether the microphone is off, in which case there is no activity to show and the chevron stays. */
	micMuted: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu passes `small: true` when the button is disabled, and clones the button with the props that open the
// menu, which is why they are forwarded as they come.
const AudioDevicePickerButton = forwardRef<HTMLButtonElement, AudioDevicePickerButtonProps>(function AudioDevicePickerButton(
	{ small: _small, level, micMuted, ...props },
	ref,
) {
	// A live microphone shows what it is hearing rather than a chevron: the one thing a caller wondering whether they
	// are being heard wants to know. A muted mic has nothing to show, so there the chevron stays.
	return (
		<ActionButton
			secondary
			flexShrink={1}
			flexGrow={0}
			{...props}
			label='Device options'
			icon={micMuted ? 'chevron-up' : <VoiceActivity level={level} size={props.large ? 24 : 20} />}
			ref={ref}
		/>
	);
});

const getDefaultDeviceItem = (label: string, type: 'input' | 'output') => ({
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
	id: `default-${type}`,
});

export type AudioDevicePickerProps = {
	/** Matches the larger variant of the microphone toggle this picker is fused to. */
	large?: boolean;
	/** Whether the microphone is off: the picker takes the toggle's colour so the two read as one control. */
	danger?: boolean;
};

/** Prefixed ids, so the rows in the menu that are not devices are not mistaken for devices. */
const NOISE_METHOD_PREFIX = 'noise-method:';

/** The microphone and speaker of a call running in this window, with the noise cancelling done to the microphone. */
// eslint-disable-next-line react/no-multi-comp
const AudioDevicePicker = ({ danger = false, large = false }: AudioDevicePickerProps) => {
	const { t } = useTranslation();

	const { self } = useCallState();
	const { selectAudioDevice } = useCallDeviceSelection();
	const { noiseSuppression } = useCallMediaProcessing();

	// A muted mic never moves, whatever it is still hearing.
	const micLevel = useAudioLevel(self.muted ? null : (self.microphoneStream ?? null));

	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	// Which hardware each id belongs to, so the system default's duplicate can be told from a second device that
	// merely shares its name.
	const { devices } = useMediaDevices();
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
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
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
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{device.id === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
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
			<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
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
			button={<AudioDevicePickerButton danger={danger} large={large} level={micLevel} micMuted={self.muted} />}
		/>
	);
};

export default AudioDevicePicker;
