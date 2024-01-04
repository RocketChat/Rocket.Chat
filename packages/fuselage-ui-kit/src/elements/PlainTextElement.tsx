import type { TextObject } from '@rocket.chat/ui-kit';

import { useAppTranslation } from '../hooks/useAppTranslation';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  const { t } = useAppTranslation();

  const text = textObject.i18n
    ? t(textObject.i18n.key, { ...textObject.i18n.args })
    : textObject.text;

  return <>{text}</>;
};

export default PlainTextElement;
