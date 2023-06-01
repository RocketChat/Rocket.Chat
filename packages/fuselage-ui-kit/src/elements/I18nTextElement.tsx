import { useTranslation } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';

const I18nTextElement = ({
  i18nKey,
  appId,
}: {
  i18nKey: string;
  appId: string;
}) => {
  const t = useTranslation() as (key: string) => string;

  return <Fragment>{t(`apps-${appId}-${i18nKey}`)}</Fragment>;
};

export default I18nTextElement;
