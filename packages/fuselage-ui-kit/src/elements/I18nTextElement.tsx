import { useTranslation } from '@rocket.chat/ui-contexts';
import { Fragment } from 'react';

import { useUiKitContext } from '../contexts/kitContext';

const I18nTextElement = ({ i18nKey }: { i18nKey: string }) => {
  const t = useTranslation() as (key: string) => string;
  const { appId } = useUiKitContext();

  return <Fragment>{t(`apps-${appId}-${i18nKey}`)}</Fragment>;
};

export default I18nTextElement;
