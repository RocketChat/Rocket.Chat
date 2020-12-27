import React, { memo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBarAction from './VerticalBarAction';

function VerticalBarClose(props) {
	const t = useTranslation();
	return <VerticalBarAction {...props} title={t('Close')} name='cross' />;
}

export default memo(VerticalBarClose);
