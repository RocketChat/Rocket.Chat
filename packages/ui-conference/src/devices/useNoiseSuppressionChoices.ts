import type { DeviceMenuChoices } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useNoiseSuppressionSelection } from './NoiseSuppressionContext';
import { NOISE_METHOD_LABELS } from '../call/lib/mediaChoiceLabels';

/** The microphone menu's noise cancellation section. */
export const useNoiseSuppressionChoices = (): DeviceMenuChoices => {
	const { t } = useTranslation();
	const { method: current, methods, pending, select } = useNoiseSuppressionSelection();

	return {
		title: t('Noise_cancellation'),
		choices: methods.map((method) => ({
			id: method,
			name: t(NOISE_METHOD_LABELS[method]),
			note: method === 'rnnoise' ? t('Noise_cancellation_on_this_device') : undefined,
			selected: method === current,
			disabled: pending,
			onSelect: () => select(method),
		})),
	};
};
