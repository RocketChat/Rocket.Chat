import { useTranslation } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';

import { useUiKitContext } from '../contexts/kitContext';

const I18nTextElement = ({
  i18nKey,
  args,
}: {
  i18nKey: string;
  args?: { [key: string]: string | number };
}) => {
  const t = useTranslation() as (
    key: string,
    args: { [key: string]: string | number }
  ) => string;
  const { appId } = useUiKitContext();

  return <Fragment>{t(`apps-${appId}-${i18nKey}`, { ...args })}</Fragment>;
};

export default I18nTextElement;
