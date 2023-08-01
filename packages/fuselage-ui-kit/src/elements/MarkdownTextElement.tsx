import { Markup } from '@rocket.chat/gazzodown';
import { parse } from '@rocket.chat/message-parser';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { TextObject } from '@rocket.chat/ui-kit';

import { useUiKitContext } from '../hooks/useUiKitContext';

const MarkdownTextElement = ({ textObject }: { textObject: TextObject }) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useUiKitContext();

  const { i18n } = textObject;

  if (i18n) {
    return (
      <Markup
        tokens={parse(t(`apps-${appId}-${i18n.key}`, { ...i18n.args }), {
          emoticons: false,
        })}
      />
    );
  }

  return <Markup tokens={parse(textObject.text, { emoticons: false })} />;
};

export default MarkdownTextElement;
