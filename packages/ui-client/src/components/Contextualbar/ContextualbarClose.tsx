import { ContextualbarAction, type ContextualbarActionProps } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export type ContextualbarCloseProps = Partial<ContextualbarActionProps>;

const ContextualbarClose = (props: ContextualbarCloseProps) => {
	const { t } = useTranslation();
	return <ContextualbarAction data-qa='ContextualbarActionClose' {...props} aria-label={t('Close')} name='cross' />;
};

export default memo(ContextualbarClose);
