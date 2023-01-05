import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo } from 'react';

import VerticalBarAction from './VerticalBarAction';

type VerticalBarCloseProps = Partial<ComponentProps<typeof VerticalBarAction>>;

const VerticalBarClose = (props: VerticalBarCloseProps): ReactElement => {
	const t = useTranslation();
	return <VerticalBarAction data-qa='VerticalBarActionClose' {...props} title={t('Close')} name='cross' />;
};

export default memo(VerticalBarClose);
