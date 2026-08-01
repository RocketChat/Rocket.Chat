import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '../../components';

type ChevronButtonProps = {
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// Same wrapper trick as DevicePicker: strip the rogue `small: true` that
// GenericMenu passes when disabled and stamp the chevron icon.
const ChevronButton = forwardRef<HTMLButtonElement, ChevronButtonProps>(function ChevronButton({ small: _small, ...props }, ref) {
	return <ActionButton flexShrink={1} flexGrow={0} {...props} label='Device options' icon='chevron-up' tiny ref={ref} />;
});

const deviceItem = (
	device: MediaDeviceInfo,
	suffix: string,
	selectedId: string | undefined,
	fallbackLabel: string,
): GenericMenuItemProps => ({
	id: `${device.deviceId}-${suffix}`,
	content: (
		<Box is='span' title={device.label || fallbackLabel} fontSize={14}>
			{device.label || fallbackLabel}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={selectedId ? device.deviceId === selectedId : device.deviceId === 'default'} />,
});

type PreFlightAudioMenuProps = {
	audioInputs: MediaDeviceInfo[];
	audioOutputs: MediaDeviceInfo[];
	selectedInputId: string | undefined;
	selectedOutputId: string | undefined;
	onSelectInput: (deviceId: string) => void;
	onSelectOutput: (deviceId: string) => void;
};

/**
 * Mic + speaker picker for the pre-flight strip — one DS Menu with Title
 * groups and radio selection, per the "Device pickers" handoff spec. Unlike
 * the in-call DevicePicker it doesn't touch MediaCallViewContext (there is no
 * call yet): selection lives in usePreFlightMedia and is handed to the
 * transport on Join.
 */
// eslint-disable-next-line react/no-multi-comp
export const PreFlightAudioMenu = ({
	audioInputs,
	audioOutputs,
	selectedInputId,
	selectedOutputId,
	onSelectInput,
	onSelectOutput,
}: PreFlightAudioMenuProps) => {
	const { t } = useTranslation();

	const sections = [
		{ title: t('Microphone'), items: audioInputs.map((device) => deviceItem(device, 'input', selectedInputId, t('Default'))) },
		{ title: t('Speaker'), items: audioOutputs.map((device) => deviceItem(device, 'output', selectedOutputId, t('Default'))) },
	];

	const disabled = audioInputs.length === 0 && audioOutputs.length === 0;

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings_lowercase')}
			sections={sections}
			disabled={disabled}
			placement='top-end'
			selectionMode='multiple'
			onAction={(id: unknown) => {
				if (typeof id !== 'string') return;
				if (id.endsWith('-input')) {
					onSelectInput(id.slice(0, -'-input'.length));
					return;
				}
				if (id.endsWith('-output')) {
					onSelectOutput(id.slice(0, -'-output'.length));
				}
			}}
			button={<ChevronButton />}
		/>
	);
};

type PreFlightCameraMenuProps = {
	videoInputs: MediaDeviceInfo[];
	selectedId: string | undefined;
	onSelect: (deviceId: string) => void;
};

// eslint-disable-next-line react/no-multi-comp
export const PreFlightCameraMenu = ({ videoInputs, selectedId, onSelect }: PreFlightCameraMenuProps) => {
	const { t } = useTranslation();

	const sections = [{ title: t('Camera'), items: videoInputs.map((device) => deviceItem(device, 'videoinput', selectedId, t('Default'))) }];
	const disabled = videoInputs.length === 0;

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Camera')}
			sections={sections}
			disabled={disabled}
			placement='top-end'
			selectionMode='single'
			onAction={(id: unknown) => {
				if (typeof id !== 'string') return;
				if (id.endsWith('-videoinput')) {
					onSelect(id.slice(0, -'-videoinput'.length));
				}
			}}
			button={<ChevronButton />}
		/>
	);
};
