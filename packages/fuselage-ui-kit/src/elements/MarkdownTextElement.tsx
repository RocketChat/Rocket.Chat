import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import type { TextObject } from '@rocket.chat/ui-kit';

import { useAppTranslation } from '../hooks/useAppTranslation';

const MarkdownTextElement = ({ textObject }: { textObject: TextObject }) => {
  const { t } = useAppTranslation();

  const text = textObject.i18n
    ? t(textObject.i18n.key, { ...textObject.i18n.args })
    : textObject.text;

  if (!text) {
    return null;
  }

  return <Markup tokens={parse(text, { emoticons: false })} />;
};

export default MarkdownTextElement;
