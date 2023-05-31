import { useTranslation } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';

const I18nTextElement = ({ i18nKey }: { i18nKey: string }) => {
  const t = useTranslation() as (key: string) => string;

  return <Fragment>{t(i18nKey)}</Fragment>;
};

export default I18nTextElement;
