import { useTranslation } from '@rocket.chat/ui-contexts';
import type { TextObject } from '@rocket.chat/ui-kit';
import { useContext } from 'react';

import { UiKitContext } from '../contexts/UiKitContext';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useContext(UiKitContext);

  const { i18n } = textObject;

  if (i18n) {
    return <>{t(`apps-${appId}-${i18n.key}`, { ...i18n.args })}</>;
  }

  return <>{textObject.text}</>;
};

export default PlainTextElement;
