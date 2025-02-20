import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbarAction } from '../../../../components/Header';

export const BackButton = ({ routeName }: { routeName?: string }): ReactElement => {
	const router = useRouter();
	const { t } = useTranslation();

	const back = useEffectEvent(() => {
		switch (routeName) {
			case 'omnichannel-directory':
				router.navigate({
					name: 'omnichannel-directory',
					params: {
						...router.getRouteParameters(),
						context: 'info',
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
