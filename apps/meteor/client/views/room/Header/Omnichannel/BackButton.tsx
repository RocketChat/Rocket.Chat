import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Header } from '@rocket.chat/ui-client';
import { useCurrentRoute, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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

	return <Header.ToolBox.Action title={t('Back')} icon='back' onClick={back} />;
};
