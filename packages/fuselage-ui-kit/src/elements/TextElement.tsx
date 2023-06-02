import { useTranslation } from '@rocket.chat/ui-contexts';
import { parse } from '@rocket.chat/message-parser';
import { Markup } from '@rocket.chat/gazzodown';
import type { TextObject } from '@rocket.chat/ui-kit';
import { Fragment } from 'react';

import { useUiKitContext } from '../contexts/kitContext';

const TextElement = ({ textObject }: { textObject: TextObject }) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useUiKitContext();

  const { i18n } = textObject;

  if (i18n) {
    textObject.text = t(`apps-${appId}-${i18n.key}`, { ...i18n.args });
  }

  if (textObject.type === 'mrkdwn') {
    return <Markup tokens={parse(textObject.text, { emoticons: false })} />;
  }

  return <Fragment>{textObject.text}</Fragment>;
};

export default TextElement;
