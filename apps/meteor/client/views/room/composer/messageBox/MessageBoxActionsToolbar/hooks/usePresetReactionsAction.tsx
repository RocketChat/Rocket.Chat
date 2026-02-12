import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const usePresetReactionsAction = (disabled: boolean, onOpenPresetReactions?: () => void): GenericMenuItemProps | undefined => {
const t = useTranslation();

return useMemo((): GenericMenuItemProps | undefined => {
if (disabled || !onOpenPresetReactions) {
return undefined;
}

return {
id: 'preset-reactions',
icon: 'emoji',
content: t('Preset_Reactions'),
onClick: () => {
onOpenPresetReactions();
},
};
}, [disabled, t, onOpenPresetReactions]);
};
