import type { DeviceMenuChoice, DeviceMenuChoices } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallMediaProcessing } from '../call/context';
import { BLUR_LEVEL_LABELS, BLUR_MODEL_LABELS } from '../call/lib/mediaChoiceLabels';

/** Asks for an image through the browser's file picker; it has to be called from the click that asked for it. */
const pickImage = (onPick: (file: File) => void) => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'image/*';
	input.addEventListener(
		'change',
		() => {
			const file = input.files?.[0];
			if (file) {
				onPick(file);
			}
		},
		{ once: true },
	);
	input.click();
};

/**
 * The camera menu's background sections: how much to blur, or which image to put behind, and, while this device does
 * the work, the model it uses. A section of its own, since which camera is one choice and its picture another.
 */
export const useBackgroundEffectChoices = (): DeviceMenuChoices[] => {
	const { t } = useTranslation();
	const { backgroundBlur } = useCallMediaProcessing();
	const { level: current, blur, pending, backgroundImage } = backgroundBlur;

	// One row per level, because "how much" is not something a switch can say. What is doing the work is said once,
	// on the level in use, the way a device says it is the system default.
	const levels = backgroundBlur.levels.map((level): DeviceMenuChoice => ({
		id: `level-${level}`,
		name: t(BLUR_LEVEL_LABELS[level]),
		note:
			level === current && level !== 'none' && blur
				? t(blur === 'camera' ? 'Background_blur_by_camera' : 'Background_blur_by_processing')
				: undefined,
		selected: !backgroundImage.active && level === current,
		disabled: pending,
		onSelect: () => backgroundBlur.select(level),
	}));

	const images: DeviceMenuChoice[] = [];
	if (backgroundImage.available) {
		if (backgroundImage.hasImage) {
			images.push({
				id: 'image-use',
				name: t('Background_image'),
				note: backgroundImage.name,
				selected: backgroundImage.active,
				disabled: pending,
				onSelect: backgroundImage.activate,
			});
		}
		images.push({
			id: 'image-choose',
			name: t('Background_image_choose'),
			onSelect: () => pickImage((file) => void backgroundImage.select(file)),
		});
	}

	const effects = [...levels, ...images];
	const sections: DeviceMenuChoices[] =
		(backgroundBlur.available || backgroundImage.available) && effects.length ? [{ title: t('Background_effects'), choices: effects }] : [];

	if (blur === 'processor' && (current !== 'none' || backgroundImage.active)) {
		sections.push({
			title: t('Background_blur_model'),
			choices: backgroundBlur.models.map((model) => ({
				id: model,
				name: t(BLUR_MODEL_LABELS[model]),
				selected: backgroundBlur.model === model,
				disabled: pending,
				onSelect: () => backgroundBlur.selectModel(model),
			})),
		});
	}

	return sections;
};
