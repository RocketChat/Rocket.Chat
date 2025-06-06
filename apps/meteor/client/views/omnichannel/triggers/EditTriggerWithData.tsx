import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import EditTrigger from './EditTrigger';
import { ContextualbarSkeletonBody } from '../../../components/Contextualbar';

const EditTriggerWithData = ({ triggerId, onClose }: { triggerId: ILivechatTrigger['_id']; onClose: () => void }) => {
	const { t } = useTranslation();
	const getTriggersById = useEndpoint('GET', '/v1/livechat/triggers/:_id', { _id: triggerId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getTriggersById', triggerId],
		queryFn: async () => getTriggersById(),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return <Callout>{t('Error')}</Callout>;
	}

	return <EditTrigger triggerData={data.trigger} onClose={onClose} />;
};

export default EditTriggerWithData;
