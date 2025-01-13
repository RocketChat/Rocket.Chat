import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import EditOauthApp from './EditOauthApp';
import { FormSkeleton } from '../../../components/Skeleton';

const EditOauthAppWithData = ({ _id, ...props }: { _id: string }): ReactElement => {
	const { t } = useTranslation();

	const getOauthApps = useEndpoint('GET', '/v1/oauth-apps.get');

	const { data, isPending, error, refetch } = useQuery({
		queryKey: ['oauth-apps', _id],
		queryFn: async () => {
			const oauthApps = await getOauthApps({ _id });
			return oauthApps;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const onChange = useCallback(() => {
		refetch();
	}, [refetch]);

	if (isPending) {
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
