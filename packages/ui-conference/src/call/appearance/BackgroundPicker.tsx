import { Icon } from '@rocket.chat/fuselage';
import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import BackgroundTile from './layout/BackgroundTile';
import BackgroundTileBlurredCamera from './layout/BackgroundTileBlurredCamera';
import BackgroundTileGrid from './layout/BackgroundTileGrid';
import BackgroundTileImage from './layout/BackgroundTileImage';
import type { BackgroundEffect, BackgroundEffectSelection } from '../../devices/BackgroundEffectContext';
import { MAX_BACKGROUND_IMAGES, isSameBackgroundEffect } from '../../devices/BackgroundEffectContext';
import { useStreamHasLiveVideo } from '../hooks/useStreamHasLiveVideo';

export type BackgroundPickerProps = {
	effect: BackgroundEffectSelection;
	/** The camera before any effect, so the blur tile shows the reader blurred rather than their current background. */
	cameraStream: MediaStream | undefined;
};

const BackgroundPicker = ({ effect, cameraStream }: BackgroundPickerProps) => {
	const { t } = useTranslation();
	const cameraLive = useStreamHasLiveVideo(cameraStream);
	const fileInput = useRef<HTMLInputElement>(null);
	const busy = !!effect.applying;

	const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		// Cleared so that choosing the same file again still counts as a choice.
		event.target.value = '';
		if (file) {
			effect.uploadImage?.(file);
		}
	};

	const tileState = (option: BackgroundEffect) => ({
		selected: isSameBackgroundEffect(effect.current, option),
		applying: !!effect.applying && isSameBackgroundEffect(effect.applying, option),
		disabled: busy,
		onClick: () => effect.select(option),
	});

	return (
		<>
			<BackgroundTileGrid label={t('Camera_background')}>
				<BackgroundTile label={t('Camera_background_none')} caption {...tileState({ mode: 'none' })}>
					<Icon name='ban' size='x20' />
				</BackgroundTile>
				<BackgroundTile label={t('Camera_background_blur')} caption {...tileState({ mode: 'blur' })}>
					{cameraLive && <BackgroundTileBlurredCamera stream={cameraStream} />}
				</BackgroundTile>
				{effect.presets.map((imageUrl, index) => (
					<BackgroundTile
						key={imageUrl}
						label={t('Camera_background_preset', { number: index + 1 })}
						{...tileState({ mode: 'image', imageUrl })}
					>
						<BackgroundTileImage src={imageUrl} />
					</BackgroundTile>
				))}
				{effect.images.map((imageUrl, index) => (
					<BackgroundTile
						key={imageUrl}
						label={t('Camera_background_image', { number: index + 1 })}
						removeLabel={effect.removeImage && t('Camera_background_remove_image')}
						onRemove={effect.removeImage && (() => effect.removeImage?.(imageUrl))}
						{...tileState({ mode: 'image', imageUrl })}
					>
						<BackgroundTileImage src={imageUrl} />
					</BackgroundTile>
				))}
				{effect.uploadImage && effect.images.length < MAX_BACKGROUND_IMAGES && (
					<BackgroundTile label={t('Camera_background_upload_image')} caption disabled={busy} onClick={() => fileInput.current?.click()}>
						<Icon name='plus' size='x20' />
					</BackgroundTile>
				)}
			</BackgroundTileGrid>
			{effect.uploadImage && <input ref={fileInput} type='file' accept='image/*' hidden onChange={onFileChange} />}
		</>
	);
};

export default BackgroundPicker;
