import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import EditTrigger from './EditTrigger';
import { ContextualbarSkeleton } from '../../../components/Contextualbar';

const EditTriggerWithData = ({ triggerId }: { triggerId: ILivechatTrigger['_id'] }) => {
	const { t } = useTranslation();
	const getTriggersById = useEndpoint('GET', '/v1/livechat/triggers/:_id', { _id: triggerId });
	const { data, isLoading, isError } = useQuery(['livechat-getTriggersById', triggerId], async () => getTriggersById(), {
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return <ContextualbarSkeleton />;
	}

	if (isError) {
		return <Callout>{t('Error')}</Callout>;
	}

	return <EditTrigger triggerData={data.trigger} />;
};

export default EditTriggerWithData;
