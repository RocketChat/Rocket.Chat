import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { HeaderToolbarAction } from '../../../../components/Header';

export const BackButton = ({ routeName }: { routeName?: string }): ReactElement => {
	const router = useRouter();
	const t = useTranslation();

	const back = useMutableCallback(() => {
		switch (routeName) {
			case 'omnichannel-directory':
				router.navigate({
					name: 'omnichannel-directory',
					params: {
						...router.getRouteParameters(),
						bar: 'info',
					},
				});
				break;

			case 'omnichannel-current-chats':
				router.navigate({ name: 'omnichannel-current-chats' });
				break;
		}
	});

	return <HeaderToolbarAction title={t('Back')} icon='back' onClick={back} />;
};
