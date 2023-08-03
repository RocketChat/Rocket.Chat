import { useTranslation } from '@rocket.chat/ui-contexts';
import type { TextObject } from '@rocket.chat/ui-kit';

import { useUiKitContext } from '../hooks/useUiKitContext';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useUiKitContext();

  const { i18n } = textObject;

  if (i18n) {
    return <>{t(`apps-${appId}-${i18n.key}`, { ...i18n.args })}</>;
  }

  return <>{textObject.text}</>;
};

export default PlainTextElement;
