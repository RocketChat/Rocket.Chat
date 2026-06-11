import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ContextualbarAction from './ContextualbarAction';

type ContextualbarBackProps = Partial<ComponentProps<typeof ContextualbarAction>>;

const ContextualbarBack = (props: ContextualbarBackProps) => {
	const { t } = useTranslation();
	return <ContextualbarAction {...props} title={t('Back')} name='arrow-back' />;
};

export default memo(ContextualbarBack);
