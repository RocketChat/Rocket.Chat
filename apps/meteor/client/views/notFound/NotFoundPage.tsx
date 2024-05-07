import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotFoundState from '../../components/NotFoundState';

const NotFoundPage = (): ReactElement => {
	const t = useTranslation();
	return <NotFoundState title={t('Page_not_found')} subtitle={t('Page_not_exist_or_not_permission')} />;
};

export default NotFoundPage;
