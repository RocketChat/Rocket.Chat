import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { EffectEntry, EffectEntryGroup } from './effectEntries';
import { CUSTOM_KEY, effectKey } from './effectEntries';
import BlurThumbnail from './thumbnails/BlurThumbnail';
import CustomThumbnail from './thumbnails/CustomThumbnail';
import ImageThumbnail from './thumbnails/ImageThumbnail';
import NoEffectThumbnail from './thumbnails/NoEffectThumbnail';
import { BLUR_LEVEL_LABELS } from '../call/lib/mediaChoiceLabels';
import { BLUR_LEVELS, useBackgroundEffectSelection } from '../devices/BackgroundEffectContext';

/** Every background effect on offer, in the groups the picker shows, with a way to focus the "Custom…" tile. */
export const useEffectEntryGroups = () => {
	const { t } = useTranslation();
	const { presets, images, imageLimit, removeImage } = useBackgroundEffectSelection();
	const customTile = useRef<HTMLDivElement>(null);

	const focusCustomTile = useCallback(() => customTile.current?.focus(), []);

	const groups = useMemo((): EffectEntryGroup[] => {
		const full = images.length >= imageLimit;

		return [
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
							// The removed tile takes the focus with it; a frame later the "Custom…" tile can have it.
							requestAnimationFrame(focusCustomTile);
						},
					})),
					{
						key: CUSTOM_KEY,
						label: t('Background_custom'),
						thumbnail: <CustomThumbnail />,
						tileRef: customTile,
						disabled: full,
						note: full ? t('Background_images_limit_reached', { count: imageLimit }) : undefined,
					},
				],
			},
			{
				key: 'off',
				title: t('Background_turn_off'),
				entries: [{ key: 'none', effect: { kind: 'none' }, label: t('Background_no_effect'), thumbnail: <NoEffectThumbnail /> }],
			},
		];
	}, [presets, images, imageLimit, removeImage, focusCustomTile, t]);

	return { groups, focusCustomTile };
};
