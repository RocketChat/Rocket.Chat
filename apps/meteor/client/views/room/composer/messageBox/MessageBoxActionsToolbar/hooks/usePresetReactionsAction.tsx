import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useChat } from '../../../../contexts/ChatContext';

export const usePresetReactionsAction = (disabled: boolean): GenericMenuItemProps | undefined => {
	const t = useTranslation();
	const chat = useChat();

	return useMemo((): GenericMenuItemProps | undefined => {
		if (disabled) {
			return undefined;
		}

		return {
			id: 'preset-reactions',
			icon: 'emoji',
			content: t('Preset_Reactions'),
			onClick: () => {
				// Open preset reactions selector
				chat?.composer.setPresetReactionsOpen?.(true);
			},
		};
	}, [disabled, t, chat]);
