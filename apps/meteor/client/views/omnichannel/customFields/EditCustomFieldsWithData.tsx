import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import EditCustomFields from './EditCustomFields';

const EditCustomFieldsWithData = ({ customFieldId }: { customFieldId: ILivechatCustomField['_id'] }) => {
	const t = useTranslation();

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
