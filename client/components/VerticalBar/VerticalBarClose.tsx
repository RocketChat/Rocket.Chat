import React, { FC, memo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBarAction from './VerticalBarAction';

const VerticalBarClose: FC<{ onClick?: () => void }> = (props) => {
	const t = useTranslation();
	return <VerticalBarAction {...props} title={t('Close')} name='cross' />;
};

export default memo(VerticalBarClose);
