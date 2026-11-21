import { Box } from '@rocket.chat/fuselage';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import EffectGrid from './EffectGrid';
import type { EffectEntry, EffectEntryGroup } from './effectEntries';
import { CUSTOM_KEY, effectKey } from './effectEntries';
import EffectTileList from './layout/EffectTileList';
import BlurThumbnail from './thumbnails/BlurThumbnail';
import CustomThumbnail from './thumbnails/CustomThumbnail';
import ImageThumbnail from './thumbnails/ImageThumbnail';
import NoEffectThumbnail from './thumbnails/NoEffectThumbnail';
import { BLUR_LEVEL_LABELS } from '../call/lib/mediaChoiceLabels';
import { BLUR_LEVELS, useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';

/**
 * Every background effect as one single choice, grouped in grids. Arrows move focus without applying, since an effect is
 * costly to start; Enter or Space applies.
 */
const BackgroundEffectPicker = () => {
	const { t } = useTranslation();
	const { effect, applying, presets, images, select, addImage, removeImage } = useBackgroundEffectSelection();
	const ref = useRef<HTMLDivElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const focusCustom = () => ref.current?.querySelector<HTMLElement>(`[data-key="${CUSTOM_KEY}"]`)?.focus();

	const groups = useMemo(
		(): EffectEntryGroup[] => [
			{
				key: 'blur',
				title: t('Background_blur'),
				entries: BLUR_LEVELS.map((level): EffectEntry => ({
					key: effectKey({ kind: 'blur', level }),
					effect: { kind: 'blur', level },
					label: t(BLUR_LEVEL_LABELS[level]),
					thumbnail: <BlurThumbnail level={level} />,
				})),
			},
			{
				key: 'images',
				title: t('Background_images'),
				entries: [
					...presets.map((preset): EffectEntry => ({
						key: effectKey({ kind: 'preset', id: preset.id }),
						effect: { kind: 'preset', id: preset.id },
						label: preset.name,
						thumbnail: <ImageThumbnail url={preset.url} />,
					})),
					...images.map((image): EffectEntry => ({
						key: effectKey({ kind: 'image', id: image.id }),
						effect: { kind: 'image', id: image.id },
						label: image.name,
						thumbnail: <ImageThumbnail url={image.url} />,
						onRemove: () => {
							removeImage(image.id);
							// Focus moves to "Custom…" when the focused tile is removed.
							requestAnimationFrame(focusCustom);
						},
					})),
					{ key: CUSTOM_KEY, label: t('Background_custom'), thumbnail: <CustomThumbnail /> },
				],
			},
			{
				key: 'off',
				title: t('Background_turn_off'),
				entries: [{ key: 'none', effect: { kind: 'none' }, label: t('Background_no_effect'), thumbnail: <NoEffectThumbnail /> }],
			},
		],
		[presets, images, removeImage, t],
	);

	const selectedKey = effectKey(effect);

	const choose = (entry: EffectEntry) => {
		if (entry.key === CUSTOM_KEY) {
			fileInput.current?.click();
			return;
		}
		if (entry.effect) {
			select(entry.effect);
		}
	};

	const applyingKey = applying ? effectKey(applying) : undefined;

	// A dismissed file picker fires `cancel`, not `change`.
	useEffect(() => {
		const input = fileInput.current;
		input?.addEventListener('cancel', focusCustom);
		return () => input?.removeEventListener('cancel', focusCustom);
	}, []);

	return (
		<Box ref={ref}>
			<EffectTileList>
				{groups.map((group) => (
					<EffectGrid
						key={group.key}
						group={group}
						selectedKey={group.entries.some((entry) => entry.key === selectedKey) ? selectedKey : undefined}
						applyingKey={applyingKey}
						disabled={!!applying}
						onChoose={choose}
					/>
				))}
			</EffectTileList>
			<input
				ref={fileInput}
				type='file'
				accept='image/*'
				hidden
				onChange={(event) => {
					const [file] = event.currentTarget.files ?? [];
					event.currentTarget.value = '';
					focusCustom();
					if (file) {
						addImage(file);
					}
				}}
			/>
		</Box>
	);
};

export default BackgroundEffectPicker;
