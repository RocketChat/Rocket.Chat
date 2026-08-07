import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallView } from '../context/MediaCallViewContext';

type CameraPickerButtonProps = {
	secondary?: boolean;
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// Mirrors DevicePicker's button-wrapper trick: strip the rogue `small: true`
// GenericMenu passes when disabled and stamp our own chevron-down icon.
const CameraPickerButton = forwardRef<HTMLButtonElement, CameraPickerButtonProps>(function CameraPickerButton(
	{ secondary = false, small: _small, ...props },
	ref,
) {
	return <ActionButton secondary={secondary} flexShrink={1} flexGrow={0} {...props} label='Camera options' icon='chevron-down' ref={ref} />;
});

// Lightweight in-component enumeration: ui-contexts' useAvailableDevices only
// covers audio, but the in-call view needs videoinput selection so we go to
// the platform directly. In an active call the camera permission is already
// granted (or will have been when the user toggled the camera on), so labels
// are populated.
const useAvailableVideoInputs = () => {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	useEffect(() => {
		if (!navigator.mediaDevices?.enumerateDevices) return undefined;
		let cancelled = false;
		const refresh = () => {
			navigator.mediaDevices
				.enumerateDevices()
				.then((list) => {
					if (cancelled) return;
					setDevices(list.filter((d) => d.kind === 'videoinput'));
				})
				.catch(() => undefined);
		};
		refresh();
		// Browsers fire `devicechange` on hot-plug / disconnect / OS-level
		// default changes; refresh so the menu reflects reality.
		navigator.mediaDevices.addEventListener?.('devicechange', refresh);
		return () => {
			cancelled = true;
			navigator.mediaDevices.removeEventListener?.('devicechange', refresh);
		};
	}, []);
	return devices;
};

// eslint-disable-next-line react/no-multi-comp
const CameraPicker = ({ secondary = false, className }: { secondary?: boolean; className?: string }) => {
	const { t } = useTranslation();
	const { onVideoInputChange, currentCameraDeviceId } = useMediaCallView();
	const devices = useAvailableVideoInputs();

	const items: GenericMenuItemProps[] = devices.map((device) => ({
		id: `${device.deviceId}-videoinput`,
		content: (
			<Box is='span' title={device.label || t('Default')} fontSize={14}>
				{device.label || t('Default')}
			</Box>
		),
		addon: <RadioButton checked={device.deviceId === currentCameraDeviceId} />,
	}));

	const sections = [{ title: t('Camera'), items }];

	// Hide entirely if the transport doesn't expose camera switching (P2P
	// today) — rendering a chevron that does nothing is worse than no chevron.
	const disabled = !onVideoInputChange || items.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Camera')}
			sections={sections}
			disabled={disabled}
			placement='top-end'
			selectionMode='single'
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			className={className}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') return;
				if (!deviceId.endsWith('-videoinput')) return;
				const id = deviceId.slice(0, -'-videoinput'.length);
				onVideoInputChange?.(id);
			}}
			button={<CameraPickerButton secondary={secondary} tiny />}
		/>
	);
};

export default CameraPicker;
