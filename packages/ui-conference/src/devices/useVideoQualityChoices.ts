import { useTranslation } from 'react-i18next';

import type { DeviceMenuChoices } from './DeviceMenu';
import { useVideoQualitySelection } from './VideoQualityContext';
import { VIDEO_QUALITY_LABELS } from '../call/lib/mediaChoiceLabels';

/**
 * The camera menu's resolution section. A ceiling rather than a promise, which is why the one in use says what the
 * camera actually gave: they are not always the same number.
 */
export const useVideoQualityChoices = (): DeviceMenuChoices => {
	const { t } = useTranslation();
	const { quality: current, qualities, height, pending, select } = useVideoQualitySelection();

	return {
		title: t('Video_quality'),
		choices: qualities.map((quality) => ({
			id: quality,
			name: t(VIDEO_QUALITY_LABELS[quality]),
			note: quality === current && height ? t('Video_quality_sending__height__p', { height }) : undefined,
			selected: quality === current,
			disabled: pending,
			onSelect: () => select(quality),
		})),
	};
};
