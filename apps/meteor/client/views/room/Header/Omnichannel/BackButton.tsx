import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import Header from '../../../../components/Header';
import { useCurrentRoute, useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

export const BackButton = ({ routeName }: { routeName?: string }): ReactElement => {
	const t = useTranslation();
	const [route = '', params] = useCurrentRoute();
	const router = useRoute(route);

	const back = useMutableCallback(() => {
		switch (routeName) {
			case 'omnichannel-directory':
				router.replace({ ...params, bar: 'info' });
				break;
			case 'omnichannel-current-chats':
				router.push();
				break;
		}
	});

	return <Header.ToolBoxAction title={t('Back')} icon='back' onClick={back} />;
};
