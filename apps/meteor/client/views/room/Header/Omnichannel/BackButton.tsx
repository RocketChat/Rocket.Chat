import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { HeaderToolbarAction } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type BackButtonProps = { routeName?: string };

const BackButton = ({ routeName }: BackButtonProps): ReactElement => {
	const router = useRouter();
	const { t } = useTranslation();

	const back = useEffectEvent(() => {
		switch (routeName) {
			case 'omnichannel-directory':
				router.navigate({
					name: 'omnichannel-directory',
					params: {
						...router.getRouteParameters(),
						tab: 'chats',
						context: 'info',
					},
				});
				break;

			case 'omnichannel-current-chats':
				router.navigate({
					name: 'omnichannel-current-chats',
					params: {
						...router.getRouteParameters(),
						tab: 'chats',
						context: 'info',
					},
				});
				break;
		}
	});

	return <HeaderToolbarAction title={t('Back')} icon='back' onClick={back} />;
};

export default BackButton;
