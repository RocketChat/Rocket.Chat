import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo, type RefObject } from 'react';

export const usePresetReactionsAction = (
	disabled: boolean,
	onOpenPresetReactions?: (ref: RefObject<HTMLButtonElement>) => void,
	emojiPickerButtonRef?: RefObject<HTMLButtonElement>,
): GenericMenuItemProps | undefined => {
	const t = useTranslation();

	return useMemo((): GenericMenuItemProps | undefined => {
		if (disabled || !onOpenPresetReactions || !emojiPickerButtonRef) {
			return undefined;
		}

		return {
			id: 'preset-reactions',
			icon: 'emoji',
			content: t('Preset_Reactions'),
			onClick: () => {
				onOpenPresetReactions(emojiPickerButtonRef);
			},
		};
	}, [disabled, t, onOpenPresetReactions, emojiPickerButtonRef]);
};
