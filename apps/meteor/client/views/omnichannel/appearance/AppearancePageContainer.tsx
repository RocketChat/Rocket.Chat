import { Callout } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useEndpoint, usePermission } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import AppearancePage from './AppearancePage';
import PageSkeleton from '../../../components/PageSkeleton';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AppearancePageContainer = () => {
	const { t } = useTranslation();

	const getLivechatAppearance = useEndpoint('GET', '/v1/livechat/appearance');
	const { isPending, isError, data } = useQuery({
		queryKey: omnichannelQueryKeys.livechat.appearance(),
		queryFn: async () => {
			const { appearance } = await getLivechatAppearance();
			return appearance;
		},
	});

	const canViewAppearance = usePermission('view-livechat-appearance');

	if (!canViewAppearance) {
		return <NotAuthorizedPage />;
	}

	if (isPending) {
		return <PageSkeleton />;
	}

	if (isError) {
		return (
			<Page>
				<PageHeader title={t('Edit_Custom_Field')} />
				<PageScrollableContentWithShadow>
					<Callout type='danger'>{t('Error')}</Callout>
				</PageScrollableContentWithShadow>
			</Page>
		);
	}

	return <AppearancePage settings={data} />;
};

export default AppearancePageContainer;
