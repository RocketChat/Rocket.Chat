import { ContextualbarAction, type ContextualbarActionProps } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export type ContextualbarBackProps = Partial<ContextualbarActionProps>;

const ContextualbarBack = (props: ContextualbarBackProps) => {
	const { t } = useTranslation();
	return <ContextualbarAction {...props} title={t('Back')} name='arrow-back' />;
};

export default memo(ContextualbarBack);
