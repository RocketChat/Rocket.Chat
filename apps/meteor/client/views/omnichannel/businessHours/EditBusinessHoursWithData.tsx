import type { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { Button, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditBusinessHours from './EditBusinessHours';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';

const EditBusinessHoursWidthData = ({ id, type }: { id?: ILivechatBusinessHour['_id']; type: LivechatBusinessHourTypes }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const getBusinessHour = useEndpoint('GET', '/v1/livechat/business-hour');

	const { data, isPending, isError, refetch } = useQuery({
		queryKey: ['livechat-getBusinessHourById', id, type],
		queryFn: async () => getBusinessHour({ _id: id, type }),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <PageSkeleton />;
	}

	if (isError) {
		return (
			<Page>
				<PageHeader title={t('Business_Hours')}>
					<Button onClick={() => router.navigate('/omnichannel/businessHours')}>{t('Back')}</Button>
				</PageHeader>
				<PageContent>
					<States>
						<StatesIcon name='warning' variation='danger' />
						<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
						<StatesActions>
							<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
						</StatesActions>
					</States>
				</PageContent>
			</Page>
		);
	}

	return <EditBusinessHours businessHourData={data.businessHour} type={type} />;
};

export default EditBusinessHoursWidthData;
