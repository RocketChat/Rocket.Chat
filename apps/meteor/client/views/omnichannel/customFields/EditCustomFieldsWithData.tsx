import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import EditCustomFields from './EditCustomFields';
import PageSkeleton from '../../../components/PageSkeleton';

const EditCustomFieldsWithData = ({ customFieldId }: { customFieldId: ILivechatCustomField['_id'] }) => {
	const { t } = useTranslation();

	const getCustomFieldById = useEndpoint('GET', '/v1/livechat/custom-fields/:_id', { _id: customFieldId });
	const { data, isLoading, isError } = useQuery(['livechat-getCustomFieldsById', customFieldId], async () => getCustomFieldById(), {
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return <PageSkeleton />;
	}

	if (isError) {
		return <Callout type='danger'>{t('Error')}</Callout>;
	}

	return <EditCustomFields customFieldData={data?.customField} />;
};

export default EditCustomFieldsWithData;
