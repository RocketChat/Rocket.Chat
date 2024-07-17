import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo } from 'react';

import ContextualbarAction from './ContextualbarAction';

type ContextualbarCloseProps = Partial<ComponentProps<typeof ContextualbarAction>>;

const ContextualbarClose = (props: ContextualbarCloseProps): ReactElement => {
	const t = useTranslation();
	return <ContextualbarAction data-qa='ContextualbarActionClose' {...props} aria-label={t('Close')} name='cross' />;
};

export default memo(ContextualbarClose);
