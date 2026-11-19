import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaCallInstance } from '../context/MediaCallInstanceContext';
import { useInstanceSnapshot } from '../context/useInstanceSnapshot';

/** The action that moves a call carried by another session of this user to this one; undefined when there is no such call */
export const useMediaCallTakeOverAction = (): { title: string; icon: IconNames; action: () => void } | undefined => {
	const { t } = useTranslation();
	const { instance } = useMediaCallInstance();

	const canTakeOver = useInstanceSnapshot(instance, (instance) => instance?.canTakeOverCall() ?? false);

	return useMemo(() => {
		if (!canTakeOver) {
			return undefined;
		}

		return {
			title: t('Continue_call_here'),
			icon: 'phone-in',
			action: () => {
				try {
					instance?.takeOverCall();
				} catch (error) {
					console.error('Error taking over call', error);
				}
			},
		};
	}, [canTakeOver, instance, t]);
};
