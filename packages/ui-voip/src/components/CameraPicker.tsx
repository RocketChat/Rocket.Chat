import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallView } from '../context/MediaCallViewContext';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from '../utils/deviceLabels';

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
	return <ActionButton secondary={secondary} flexShrink={1} flexGrow={0} {...props} label='Camera options' icon='chevron-up' ref={ref} />;
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

/** Prefixed ids, so the rows in the menu that are not cameras are not mistaken for cameras. */
const BLUR_LEVEL_PREFIX = 'blur-level:';
const BLUR_MODEL_PREFIX = 'blur-model:';
const BACKGROUND_IMAGE_PREFIX = 'background-image:';
const VIDEO_QUALITY_PREFIX = 'video-quality:';

const VIDEO_QUALITY_LABELS: Record<string, string> = {
	auto: 'Video_quality_auto',
	h1080: 'Video_quality_1080p',
	h720: 'Video_quality_720p',
	h360: 'Video_quality_360p',
	h180: 'Video_quality_180p',
};

const BLUR_LEVEL_LABELS: Record<string, string> = {
	none: 'Background_blur_none',
	light: 'Background_blur_light',
	medium: 'Background_blur_medium',
	strong: 'Background_blur_strong',
};

const BLUR_MODEL_LABELS: Record<string, string> = {
	quality: 'Background_blur_model_quality',
	performance: 'Background_blur_model_performance',
};

// eslint-disable-next-line react/no-multi-comp
const CameraPicker = ({ secondary = true, danger = false, className }: { secondary?: boolean; danger?: boolean; className?: string }) => {
	const { t } = useTranslation();
	const { onVideoInputChange, currentCameraDeviceId, backgroundBlur, videoQuality } = useMediaCallView();
	const devices = useAvailableVideoInputs();
	const backgroundImageInput = useRef<HTMLInputElement>(null);

	// The system default first, its duplicate dropped, and every name without the USB id the browser tacks on.
	const ordered = useMemo(() => orderDevices(devices), [devices]);

	// What is in use when nothing has been picked is the first on offer, which is what makes clicking it a no-op
	// below rather than a switch to the camera already running.
	const currentId = currentCameraDeviceId ?? ordered[0]?.deviceId;

	const items: GenericMenuItemProps[] = ordered.map((device) => {
		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.deviceId}-videoinput`,
			textValue: name,
			content: (
				<Box title={name} fontSize={14} display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{/* Said on its own line, as a fact about the device rather than part of its name. */}
					{device.deviceId === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System')} {t('Default').toLowerCase()}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked={device.deviceId === currentId} />,
		};
	});

	// Blurring the background belongs with the camera, but not among the cameras: those are a choice of *which* one,
	// and this is something done to whichever is chosen. Offered the same way, as one row per choice, because "how
	// much" is a choice like any other — a switch could only ever say on, and on is not an amount.
	const blurItems: GenericMenuItemProps[] = (backgroundBlur?.levels ?? []).map((blurLevel) => ({
		id: `${BLUR_LEVEL_PREFIX}${blurLevel}`,
		textValue: t(BLUR_LEVEL_LABELS[blurLevel] ?? 'Background_blur'),
		content: (
			<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(BLUR_LEVEL_LABELS[blurLevel] ?? 'Background_blur')}
				</Box>
				{/* Said once, on the level in use, because it is a fact about what is doing the work rather than about
				    the choice — the same place a device says it is the system default. */}
				{backgroundBlur?.level === blurLevel && blurLevel !== 'none' && backgroundBlur.blur && (
					<Box is='span' fontScale='c1' color='hint'>
						{t(backgroundBlur.blur === 'camera' ? 'Background_blur_by_camera' : 'Background_blur_by_processing')}
					</Box>
				)}
			</Box>
		),
		addon: (
			<RadioButton
				checked={!backgroundBlur?.backgroundImage?.active && backgroundBlur?.level === blurLevel}
				disabled={backgroundBlur?.pending}
				readOnly
			/>
		),
	}));

	const backgroundImageItems: GenericMenuItemProps[] = backgroundBlur?.backgroundImage?.available
		? [
				...(backgroundBlur.backgroundImage.hasImage
					? [
							{
								id: `${BACKGROUND_IMAGE_PREFIX}use`,
								textValue: t('Background_image'),
								content: (
									<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
										<Box is='span' withTruncatedText>
											{t('Background_image')}
										</Box>
										{backgroundBlur.backgroundImage.name && (
											<Box is='span' fontScale='c1' color='hint' withTruncatedText>
												{backgroundBlur.backgroundImage.name}
											</Box>
										)}
									</Box>
								),
								addon: <RadioButton checked={backgroundBlur.backgroundImage.active} disabled={backgroundBlur.pending} readOnly />,
							},
						]
					: []),
				{
					id: `${BACKGROUND_IMAGE_PREFIX}choose`,
					textValue: t('Background_image_choose'),
					content: <Box fontSize={14}>{t('Background_image_choose')}</Box>,
				},
			]
		: [];

	const backgroundSection = { title: t('Background_effects'), items: [...blurItems, ...backgroundImageItems] };

	const modelItems: GenericMenuItemProps[] =
		backgroundBlur?.blur === 'processor' &&
		(backgroundBlur.level !== 'none' || backgroundBlur.backgroundImage?.active) &&
		backgroundBlur.models
			? backgroundBlur.models.map((model) => ({
					id: `${BLUR_MODEL_PREFIX}${model}`,
					textValue: t(BLUR_MODEL_LABELS[model] ?? model),
					content: (
						<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
							<Box is='span' withTruncatedText>
								{t(BLUR_MODEL_LABELS[model] ?? model)}
							</Box>
						</Box>
					),
					addon: <RadioButton checked={backgroundBlur.model === model} disabled={backgroundBlur.pending} readOnly />,
				}))
			: [];

	const modelSection = { title: t('Background_blur_model'), items: modelItems };

	// The most detail to send: a ceiling rather than a promise, which is why each row says the size it asks for and
	// the one in use says what the camera actually gave — they are not always the same number.
	const qualityItems: GenericMenuItemProps[] = (videoQuality?.qualities ?? []).map((quality) => ({
		id: `${VIDEO_QUALITY_PREFIX}${quality}`,
		textValue: t(VIDEO_QUALITY_LABELS[quality] ?? 'Video_quality'),
		content: (
			<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(VIDEO_QUALITY_LABELS[quality] ?? 'Video_quality')}
				</Box>
				{videoQuality?.quality === quality && videoQuality.height && (
					<Box is='span' fontScale='c1' color='hint'>
						{t('Video_quality_sending__height__p', { height: videoQuality.height })}
					</Box>
				)}
			</Box>
		),
		addon: <RadioButton checked={videoQuality?.quality === quality} disabled={videoQuality?.pending} readOnly />,
	}));

	const qualitySection = { title: t('Video_quality'), items: qualityItems };

	const cameraSection = { title: t('Camera'), items };
	const sections = [
		cameraSection,
		...(qualityItems.length ? [qualitySection] : []),
		...((backgroundBlur?.available || backgroundBlur?.backgroundImage?.available) && (blurItems.length || backgroundImageItems.length)
			? [backgroundSection]
			: []),
		...(modelItems.length ? [modelSection] : []),
	];

	// Hide entirely if the transport doesn't expose camera switching (P2P
	// today) — rendering a chevron that does nothing is worse than no chevron.
	const disabled = !onVideoInputChange || items.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	return (
		<>
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
					if (deviceId.startsWith(VIDEO_QUALITY_PREFIX)) {
						videoQuality?.select(deviceId.slice(VIDEO_QUALITY_PREFIX.length));
						return;
					}
					if (deviceId.startsWith(BLUR_LEVEL_PREFIX)) {
						backgroundBlur?.select(deviceId.slice(BLUR_LEVEL_PREFIX.length));
						return;
					}
					if (deviceId.startsWith(BLUR_MODEL_PREFIX)) {
						backgroundBlur?.selectModel?.(deviceId.slice(BLUR_MODEL_PREFIX.length));
						return;
					}
					if (deviceId === `${BACKGROUND_IMAGE_PREFIX}use`) {
						backgroundBlur?.backgroundImage?.activate();
						return;
					}
					if (deviceId === `${BACKGROUND_IMAGE_PREFIX}choose`) {
						backgroundImageInput.current?.click();
						return;
					}
					if (!deviceId.endsWith('-videoinput')) return;
					const id = deviceId.slice(0, -'-videoinput'.length);
					// Picking the camera already in use is not a change, and putting it through the switch anyway tore the
					// running track down and came back with a black frame. Nothing to do is nothing to do.
					if (id === currentId) return;
					onVideoInputChange?.(id);
				}}
				button={<CameraPickerButton secondary={secondary} danger={danger} />}
			/>
			<input
				ref={backgroundImageInput}
				type='file'
				accept='image/*'
				hidden
				onChange={(event) => {
					const input = event.currentTarget;
					const file = input.files?.[0];
					input.value = '';
					if (file) {
						void backgroundBlur?.backgroundImage?.select(file);
					}
				}}
			/>
		</>
	);
};

export default CameraPicker;
