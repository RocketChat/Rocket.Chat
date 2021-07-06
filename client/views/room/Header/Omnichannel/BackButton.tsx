import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { memo, FC } from 'react';

import Header from '../../../../components/Header';
import { useCurrentRoute, useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

const BackButton: FC = () => {
	const t = useTranslation();
	const [route = '', params] = useCurrentRoute();
	const router = useRoute(route);

	const back = useMutableCallback(() => {
		router.replace({ ...params, bar: 'info' });
	});

	return <Header.ToolBoxAction title={t('Back')} icon='back' onClick={back} />;
};

export default memo(BackButton);
