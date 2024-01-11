import type * as UiKit from '@rocket.chat/ui-kit';
import { useCallback } from 'react';

import { useAppTranslation } from './useAppTranslation';

export const useStringFromTextObject = () => {
  const { t } = useAppTranslation();

  return useCallback(
    (textObject: UiKit.TextObject | undefined): string | undefined => {
      if (!textObject) {
        return undefined;
      }

      return textObject.i18n
        ? t?.(textObject.i18n.key, { ...textObject.i18n.args })
        : textObject.text;
    },
    [t]
  );
};
