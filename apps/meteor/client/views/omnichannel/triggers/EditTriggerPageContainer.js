import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import PageSkeleton from '../../../components/PageSkeleton';
import EditTriggerPage from './EditTriggerPage';

const EditTriggerPageContainer = ({ id, onSave }) => {
	const t = useTranslation();
	const getTrigger = useEndpoint('GET', '/v1/livechat/triggers/:_id', { _id: id });
	const { data, isInitialLoading, isError } = useQuery(['/v1/livechat/triggers/:_id', id], () => getTrigger());

	if (isInitialLoading) {
		return <PageSkeleton />;
	}

	if (isError || !data?.trigger) {
		return <Callout>{t('Error')}: error</Callout>;
	}

	return <EditTriggerPage data={data.trigger} onSave={onSave} />;
};

export default EditTriggerPageContainer;
