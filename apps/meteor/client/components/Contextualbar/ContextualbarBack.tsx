import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo } from 'react';

import ContextualbarAction from './ContextualbarAction';

type ContextualbarBackProps = Partial<ComponentProps<typeof ContextualbarAction>>;

const ContextualbarBack = (props: ContextualbarBackProps): ReactElement => {
	const t = useTranslation();
	return <ContextualbarAction {...props} title={t('Back')} name='arrow-back' />;
};

export default memo(ContextualbarBack);
