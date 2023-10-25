import type { TextObject } from '@rocket.chat/ui-kit';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitContext } from '../contexts/UiKitContext';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  const { appId } = useContext(UiKitContext);
  const { t } = useTranslation(`app-${appId}`);

  const text = textObject.i18n
    ? t(textObject.i18n.key, { ...textObject.i18n.args })
    : textObject.text;

  return <>{text}</>;
};

export default PlainTextElement;
