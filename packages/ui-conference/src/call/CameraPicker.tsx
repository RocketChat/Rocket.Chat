import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { ActionButton } from '@rocket.chat/ui-voip';
import type { ComponentProps } from 'react';
import { forwardRef, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCallDeviceSelection, useCallMediaProcessing } from './context';
import { useMediaDevices } from './hooks/useMediaDevices';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from './lib/deviceLabels';
import { BLUR_LEVEL_LABELS, BLUR_MODEL_LABELS, VIDEO_QUALITY_LABELS } from './lib/mediaChoiceLabels';

type CameraPickerButtonProps = {
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu passes `small: true` when the button is disabled, and clones the button with the props that open the
// menu, which is why they are forwarded as they come.
const CameraPickerButton = forwardRef<HTMLButtonElement, CameraPickerButtonProps>(function CameraPickerButton(
	{ small: _small, ...props },
	ref,
) {
	return <ActionButton secondary flexShrink={1} flexGrow={0} {...props} label='Camera options' icon='chevron-up' ref={ref} />;
});

/** Prefixed ids, so the rows in the menu that are not cameras are not mistaken for cameras. */
const BLUR_LEVEL_PREFIX = 'blur-level:';
const BLUR_MODEL_PREFIX = 'blur-model:';
const BACKGROUND_IMAGE_PREFIX = 'background-image:';
const VIDEO_QUALITY_PREFIX = 'video-quality:';

export type CameraPickerProps = {
	danger?: boolean;
	/** Matches the larger variant of the camera toggle this picker is fused to. */
	large?: boolean;
};

/** The camera of a call running in this window, with what is done to its picture: quality, blur, background. */
// eslint-disable-next-line react/no-multi-comp
const CameraPicker = ({ danger = false, large = false }: CameraPickerProps) => {
	const { t } = useTranslation();
	const { selectCamera, currentCameraId: currentCameraDeviceId } = useCallDeviceSelection();
	const { backgroundBlur, videoQuality } = useCallMediaProcessing();
	const { devices } = useMediaDevices();
	const backgroundImageInput = useRef<HTMLInputElement>(null);

	// The system default first, its duplicate dropped, and every name without the USB id the browser tacks on.
	const ordered = useMemo(() => orderDevices(devices.filter(({ kind }) => kind === 'videoinput')), [devices]);

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
	const blurItems: GenericMenuItemProps[] = backgroundBlur.levels.map((blurLevel) => ({
		id: `${BLUR_LEVEL_PREFIX}${blurLevel}`,
		textValue: t(BLUR_LEVEL_LABELS[blurLevel]),
		content: (
			<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(BLUR_LEVEL_LABELS[blurLevel])}
				</Box>
				{/* Said once, on the level in use, because it is a fact about what is doing the work rather than about
				    the choice — the same place a device says it is the system default. */}
				{backgroundBlur.level === blurLevel && blurLevel !== 'none' && backgroundBlur.blur && (
					<Box is='span' fontScale='c1' color='hint'>
						{t(backgroundBlur.blur === 'camera' ? 'Background_blur_by_camera' : 'Background_blur_by_processing')}
					</Box>
				)}
			</Box>
		),
		addon: (
			<RadioButton
				checked={!backgroundBlur.backgroundImage.active && backgroundBlur.level === blurLevel}
				disabled={backgroundBlur.pending}
				readOnly
			/>
		),
	}));

	const backgroundImageItems: GenericMenuItemProps[] = backgroundBlur.backgroundImage.available
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
		backgroundBlur.blur === 'processor' && (backgroundBlur.level !== 'none' || backgroundBlur.backgroundImage.active)
			? backgroundBlur.models.map((model) => ({
					id: `${BLUR_MODEL_PREFIX}${model}`,
					textValue: t(BLUR_MODEL_LABELS[model]),
					content: (
						<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
							<Box is='span' withTruncatedText>
								{t(BLUR_MODEL_LABELS[model])}
							</Box>
						</Box>
					),
					addon: <RadioButton checked={backgroundBlur.model === model} disabled={backgroundBlur.pending} readOnly />,
				}))
			: [];

	const modelSection = { title: t('Background_blur_model'), items: modelItems };

	// The most detail to send: a ceiling rather than a promise, which is why each row says the size it asks for and
	// the one in use says what the camera actually gave — they are not always the same number.
	const qualityItems: GenericMenuItemProps[] = videoQuality.qualities.map((quality) => ({
		id: `${VIDEO_QUALITY_PREFIX}${quality}`,
		textValue: t(VIDEO_QUALITY_LABELS[quality]),
		content: (
			<Box display='flex' flexDirection='column' fontSize={14} minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(VIDEO_QUALITY_LABELS[quality])}
				</Box>
				{videoQuality.quality === quality && videoQuality.height && (
					<Box is='span' fontScale='c1' color='hint'>
						{t('Video_quality_sending__height__p', { height: videoQuality.height })}
					</Box>
				)}
			</Box>
		),
		addon: <RadioButton checked={videoQuality.quality === quality} disabled={videoQuality.pending} readOnly />,
	}));

	const qualitySection = { title: t('Video_quality'), items: qualityItems };

	const cameraSection = { title: t('Camera'), items };
	const sections = [
		cameraSection,
		...(qualityItems.length ? [qualitySection] : []),
		...((backgroundBlur.available || backgroundBlur.backgroundImage.available) && (blurItems.length || backgroundImageItems.length)
			? [backgroundSection]
			: []),
		...(modelItems.length ? [modelSection] : []),
	];

	const disabled = items.length === 0;

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
				onAction={(deviceId) => {
					if (typeof deviceId !== 'string') return;
					if (deviceId.startsWith(VIDEO_QUALITY_PREFIX)) {
						const quality = videoQuality.qualities.find((quality) => `${VIDEO_QUALITY_PREFIX}${quality}` === deviceId);
						if (quality) videoQuality.select(quality);
						return;
					}
					if (deviceId.startsWith(BLUR_LEVEL_PREFIX)) {
						const level = backgroundBlur.levels.find((level) => `${BLUR_LEVEL_PREFIX}${level}` === deviceId);
						if (level) backgroundBlur.select(level);
						return;
					}
					if (deviceId.startsWith(BLUR_MODEL_PREFIX)) {
						const model = backgroundBlur.models.find((model) => `${BLUR_MODEL_PREFIX}${model}` === deviceId);
						if (model) backgroundBlur.selectModel(model);
						return;
					}
					if (deviceId === `${BACKGROUND_IMAGE_PREFIX}use`) {
						backgroundBlur.backgroundImage.activate();
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
					selectCamera(id);
				}}
				button={<CameraPickerButton danger={danger} large={large} />}
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
						void backgroundBlur.backgroundImage.select(file);
					}
				}}
			/>
		</>
	);
};

export default CameraPicker;
