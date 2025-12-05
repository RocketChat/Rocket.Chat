import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbarAction } from '../../../../components/Header';

type BackButtonProps = { routeName?: string };

const BackButton = ({ routeName }: BackButtonProps): ReactElement => {
	const router = useRouter();
	const { t } = useTranslation();

	const back = useEffectEvent(() => {
		if (routeName === 'omnichannel-directory') {
			router.navigate({
				name: 'omnichannel-directory',
				params: {
					...router.getRouteParameters(),
					bar: 'info',
				},
			});
		}
	});

	return <HeaderToolbarAction title={t('Back')} icon='back' onClick={back} />;
};

export default BackButton;
