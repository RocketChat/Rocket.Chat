import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { FormSkeleton } from '../../../components/Skeleton';
import EditOauthApp from './EditOauthApp';

const EditOauthAppWithData = ({ _id, ...props }: { _id: string }): ReactElement => {
	const t = useTranslation();

	const getOauthApps = useEndpoint('GET', '/v1/oauth-apps.get');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, refetch } = useQuery(
		['oauth-apps', _id],
		async () => {
			const oauthApps = await getOauthApps({ _id });
			return oauthApps;
		},
		{
			onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		},
	);

	const onChange = useCallback(() => {
		refetch();
	}, [refetch]);

	if (isLoading) {
		return <FormSkeleton pi={20} />;
	}

	if (error || !data || !_id) {
		return (
			<Box fontScale='h2' pb={20}>
				{t('error-application-not-found')}
			</Box>
		);
	}

	return <EditOauthApp data={data.oauthApp} onChange={onChange} {...props} />;
};

export default EditOauthAppWithData;
