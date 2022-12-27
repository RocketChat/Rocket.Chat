import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { memo } from 'react';

import VerticalBarAction from './VerticalBarAction';

type VerticalBarBackProps = Partial<ComponentProps<typeof VerticalBarAction>>;

const VerticalBarBack = (props: VerticalBarBackProps): ReactElement => {
	const t = useTranslation();
	return <VerticalBarAction {...props} title={t('Back')} name='arrow-back' />;
};

export default memo(VerticalBarBack);
