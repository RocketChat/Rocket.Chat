import type { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { Button, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { Page, PageHeader, PageContent } from '../../../components/Page';
import PageSkeleton from '../../../components/PageSkeleton';
import EditBusinessHours from './EditBusinessHours';

const EditBusinessHoursWidthData = ({ id, type }: { id?: ILivechatBusinessHour['_id']; type: LivechatBusinessHourTypes }) => {
	const t = useTranslation();
	const router = useRouter();
	const getBusinessHour = useEndpoint('GET', '/v1/livechat/business-hour');

	const { data, isLoading, isError, refetch } = useQuery(
		['livechat-getBusinessHourById', id, type],
		async () => getBusinessHour({ _id: id, type }),
		{
			refetchOnWindowFocus: false,
		},
	);

	if (isLoading) {
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
