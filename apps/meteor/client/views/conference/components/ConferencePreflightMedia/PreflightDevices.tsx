import { Box } from '@rocket.chat/fuselage';
import type { BlurLevel, BlurModel, NoiseMethod, VideoQuality } from '@rocket.chat/ui-conference';
import {
	useBackgroundBlurPreference,
	useCallDevicesInitialState,
	useNoiseSuppressionPreference,
	useVideoQualityPreference,
} from '@rocket.chat/ui-conference';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import { supportsBackgroundBlur } from '../../../videoConference/livekit/backgroundBlurSupport';
import {
	activateVirtualBackground,
	deactivateVirtualBackground,
	selectVirtualBackground,
	useVirtualBackground,
} from '../../../videoConference/livekit/virtualBackground';
import CallDeviceMenu from '../CallDeviceMenu';

/**
 * The methods offered before a call, weakest first. Krisp is absent: whether a workspace may use it is only known
 * once it is attached to a published track, so the call's own menu offers it after it has proven itself.
 */
const NOISE_CHOICES: { id: NoiseMethod; label: string; note?: string }[] = [
	{ id: 'none', label: 'Noise_cancellation_off' },
	{ id: 'browser', label: 'Noise_cancellation_standard' },
	{ id: 'rnnoise', label: 'Noise_cancellation_rnnoise', note: 'Noise_cancellation_on_this_device' },
];

const BLUR_CHOICES: { id: BlurLevel; label: string }[] = [
	{ id: 'none', label: 'Background_blur_none' },
	{ id: 'light', label: 'Background_blur_light' },
	{ id: 'medium', label: 'Background_blur_medium' },
	{ id: 'strong', label: 'Background_blur_strong' },
];

const BLUR_MODEL_CHOICES: { id: BlurModel; label: string }[] = [
	{ id: 'quality', label: 'Background_blur_model_quality' },
	{ id: 'performance', label: 'Background_blur_model_performance' },
];

const QUALITY_CHOICES: { id: VideoQuality; label: string }[] = [
	{ id: 'auto', label: 'Video_quality_auto' },
	{ id: 'h1080', label: 'Video_quality_1080p' },
	{ id: 'h720', label: 'Video_quality_720p' },
	{ id: 'h360', label: 'Video_quality_360p' },
	{ id: 'h180', label: 'Video_quality_180p' },
];

const BACKGROUND_IMAGE_USE = 'background-image:use';
const BACKGROUND_IMAGE_CHOOSE = 'background-image:choose';

const PreflightDevices = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);
	const { noiseMethod, selectNoiseMethod } = useNoiseSuppressionPreference();
	const { videoQuality, selectVideoQuality } = useVideoQualityPreference();
	const { blurLevel, selectBlurLevel, blurModel, selectBlurModel } = useBackgroundBlurPreference();
	const virtualBackground = useVirtualBackground();
	const backgroundImageInput = useRef<HTMLInputElement>(null);
	const canSelectBackgroundImage = useMemo(supportsBackgroundBlur, []);

	const backgroundChoices = useMemo(
		() => [
			...BLUR_CHOICES.map(({ id, label }) => ({ id, name: t(label) })),
			...(canSelectBackgroundImage && virtualBackground.image
				? [{ id: BACKGROUND_IMAGE_USE, name: `${t('Background_image')} — ${virtualBackground.name ?? ''}` }]
				: []),
			...(canSelectBackgroundImage ? [{ id: BACKGROUND_IMAGE_CHOOSE, name: t('Background_image_choose') }] : []),
		],
		[canSelectBackgroundImage, t, virtualBackground.image, virtualBackground.name],
	);

	const selectBackgroundEffect = useCallback(
		(id: string) => {
			if (id === BACKGROUND_IMAGE_CHOOSE) {
				backgroundImageInput.current?.click();
				return;
			}
			if (id === BACKGROUND_IMAGE_USE) {
				selectBlurLevel('none');
				activateVirtualBackground();
				return;
			}
			deactivateVirtualBackground();
			selectBlurLevel(id as BlurLevel);
		},
		[selectBlurLevel],
	);

	return (
		<Box
			display='grid'
			width='100%'
			alignItems='center'
			marginBlockStart={12}
			paddingInline={20}
			// `auto-fit` is what makes them wrap: three columns while there is room, one per row on a phone, where
			// forcing three cut every device name down to nothing.
			style={{ gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
		>
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
						void selectVirtualBackground(file)
							.then(() => selectBlurLevel('none'))
							.catch((err: unknown) => console.warn('virtual background image could not be selected', err));
					}
				}}
			/>
			{capabilities.mic && (
				<CallDeviceMenu
					icon='mic'
					label={t('Microphone')}
					devices={preview.audioInputs}
					selectedId={devices.micId}
					onSelect={(deviceId) => selectDevice('mic', deviceId)}
					sections={[
						{
							title: t('Noise_cancellation'),
							choices: NOISE_CHOICES.map(({ id, label: name, note }) => ({ id, name: t(name), note })),
							selectedId: noiseMethod,
							onSelect: (method) => selectNoiseMethod(method as NoiseMethod),
						},
					]}
				/>
			)}
			<CallDeviceMenu
				icon='volume'
				label={t('Speaker')}
				devices={preview.audioOutputs}
				selectedId={devices.speakerId}
				onSelect={(deviceId) => selectDevice('speaker', deviceId)}
			/>
			{capabilities.cam && (
				<CallDeviceMenu
					icon='video'
					label={t('Camera')}
					devices={preview.videoInputs}
					selectedId={devices.camId}
					onSelect={(deviceId) => selectDevice('cam', deviceId)}
					sections={[
						{
							title: t('Video_quality'),
							choices: QUALITY_CHOICES.map(({ id, label: name }) => ({ id, name: t(name) })),
							selectedId: videoQuality,
							onSelect: (quality) => selectVideoQuality(quality as VideoQuality),
						},
						{
							title: t('Background_effects'),
							choices: backgroundChoices,
							selectedId: virtualBackground.active ? BACKGROUND_IMAGE_USE : blurLevel,
							onSelect: selectBackgroundEffect,
						},
						...(blurLevel !== 'none' || virtualBackground.active
							? [
									{
										title: t('Background_blur_model'),
										choices: BLUR_MODEL_CHOICES.map(({ id, label: name }) => ({ id, name: t(name) })),
										selectedId: blurModel,
										onSelect: (model: string) => selectBlurModel(model as BlurModel),
									},
								]
							: []),
					]}
				/>
			)}
		</Box>
	);
};

export default PreflightDevices;
