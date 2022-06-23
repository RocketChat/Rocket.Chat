import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, memo, ComponentProps } from 'react';

import VerticalBarAction from './VerticalBarAction';

type VerticalBarBackProps = Partial<ComponentProps<typeof VerticalBarAction>>;

const VerticalBarBack = (props: VerticalBarBackProps): ReactElement => {
	const t = useTranslation();
	return <VerticalBarAction {...props} title={t('Back')} name='arrow-back' />;
};

export default memo(VerticalBarBack);
