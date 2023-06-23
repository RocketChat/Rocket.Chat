import type { TextObject } from '@rocket.chat/ui-kit';
import { Fragment } from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

import { useUiKitContext } from '../contexts/kitContext';

const PlainTextElement = ({ textObject }: { textObject: TextObject }) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useUiKitContext();

  const { i18n } = textObject;

  if (i18n) {
    return (
      <Fragment>{t(`apps-${appId}-${i18n.key}`, { ...i18n.args })}</Fragment>
    );
  }

  return <Fragment>{textObject.text}</Fragment>;
};

export default PlainTextElement;
