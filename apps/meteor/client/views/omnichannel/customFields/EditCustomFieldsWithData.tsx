import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditCustomFields from './EditCustomFields';
import PageSkeleton from '../../../components/PageSkeleton';

const EditCustomFieldsWithData = ({ customFieldId }: { customFieldId: ILivechatCustomField['_id'] }) => {
	const { t } = useTranslation();

	const getCustomFieldById = useEndpoint('GET', '/v1/livechat/custom-fields/:_id', { _id: customFieldId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getCustomFieldsById', customFieldId],
		queryFn: async () => getCustomFieldById(),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <PageSkeleton />;
	}

	if (isError) {
		return <Callout type='danger'>{t('Error')}</Callout>;
	}

	return <EditCustomFields customFieldData={data?.customField} />;
};

export default EditCustomFieldsWithData;
