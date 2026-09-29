import {
	activateVirtualBackground,
	deactivateVirtualBackground,
	getVirtualBackgroundSnapshot,
	selectVirtualBackground,
	subscribeVirtualBackground,
	supportsBackgroundBlur,
} from '@rocket.chat/media-processors';
import type { BlurLevel } from '@rocket.chat/ui-conference';
import {
	BLUR_LEVEL_LABELS,
	BLUR_MODEL_LABELS,
	VIDEO_QUALITY_LABELS,
	choicesOf,
	useBackgroundBlurPreference,
	useCallDevicesInitialState,
	useVideoQualityPreference,
} from '@rocket.chat/ui-conference';
import { useMemo, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import DeviceMenuOption from '../DeviceMenu/DeviceMenuOption';
import DeviceMenuSection from '../DeviceMenu/DeviceMenuSection';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

/** Which camera to arrive on, and what is done to its picture: how much detail, and what happens to the background. */
const CameraMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);
	const { videoQuality, selectVideoQuality } = useVideoQualityPreference();
	const { blurLevel, selectBlurLevel, blurModel, selectBlurModel } = useBackgroundBlurPreference();
	const virtualBackground = useSyncExternalStore(subscribeVirtualBackground, getVirtualBackgroundSnapshot);
	const backgroundImageInput = useRef<HTMLInputElement>(null);
	const canSelectBackgroundImage = useMemo(supportsBackgroundBlur, []);

	const rows = useMemo(() => deviceMenuRows(preview.videoInputs), [preview.videoInputs]);
	const selected = selectedDevice(rows, devices.camId);

	const selectBlur = (level: BlurLevel) => {
		deactivateVirtualBackground();
		selectBlurLevel(level);
	};

	const applyBackgroundImage = () => {
		selectBlurLevel('none');
		activateVirtualBackground();
	};

	return (
		<>
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
			<DeviceMenu icon='video' label={t('Camera')} current={selected?.name} disabled={!rows.length}>
				<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('cam', deviceId)} />
				<DeviceMenuSection title={t('Video_quality')}>
					{choicesOf(VIDEO_QUALITY_LABELS).map((quality) => (
						<DeviceMenuOption
							key={quality}
							name={t(VIDEO_QUALITY_LABELS[quality])}
							selected={quality === videoQuality}
							onSelect={() => selectVideoQuality(quality)}
						/>
					))}
				</DeviceMenuSection>
				<DeviceMenuSection title={t('Background_effects')}>
					{choicesOf(BLUR_LEVEL_LABELS).map((level) => (
						<DeviceMenuOption
							key={level}
							name={t(BLUR_LEVEL_LABELS[level])}
							selected={!virtualBackground.active && level === blurLevel}
							onSelect={() => selectBlur(level)}
						/>
					))}
					{canSelectBackgroundImage && virtualBackground.image && (
						<DeviceMenuOption
							name={`${t('Background_image')} — ${virtualBackground.name ?? ''}`}
							selected={virtualBackground.active}
							onSelect={applyBackgroundImage}
						/>
					)}
					{canSelectBackgroundImage && (
						<DeviceMenuOption name={t('Background_image_choose')} selected={false} onSelect={() => backgroundImageInput.current?.click()} />
					)}
				</DeviceMenuSection>
				{(blurLevel !== 'none' || virtualBackground.active) && (
					<DeviceMenuSection title={t('Background_blur_model')}>
						{choicesOf(BLUR_MODEL_LABELS).map((model) => (
							<DeviceMenuOption
								key={model}
								name={t(BLUR_MODEL_LABELS[model])}
								selected={model === blurModel}
								onSelect={() => selectBlurModel(model)}
							/>
						))}
					</DeviceMenuSection>
				)}
			</DeviceMenu>
		</>
	);
};

export default CameraMenu;
