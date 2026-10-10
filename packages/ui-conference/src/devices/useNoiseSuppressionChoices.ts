import type { DeviceMenuChoices } from '@rocket.chat/ui-media';
import { useTranslation } from 'react-i18next';

import { useCallMediaProcessing } from '../call/context';
import { NOISE_METHOD_LABELS, NOISE_METHOD_NOTES } from '../call/lib/mediaChoiceLabels';

/**
 * The microphone menu's noise cancelling section, none while there is nothing to offer. It belongs with the
 * microphone but not among the microphones: those are a choice of which one, this is what is done to it.
 */
export const useNoiseSuppressionChoices = (): DeviceMenuChoices[] => {
	const { t } = useTranslation();
	const { methods, method: current, pending, select } = useCallMediaProcessing().noiseSuppression;

	if (!methods.length) {
		return [];
	}

	return [
		{
			title: t('Noise_cancellation'),
			choices: methods.map((method) => {
				const note = NOISE_METHOD_NOTES[method];
				return {
					id: method,
					name: t(NOISE_METHOD_LABELS[method]),
					note: note && t(note),
					selected: method === current,
					disabled: pending,
					onSelect: () => select(method),
				};
			}),
		},
	];
};
