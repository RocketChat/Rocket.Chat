import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';

import EditOauthApp from './EditOauthApp';

const EditOauthAppWithData = ({ _id, ...props }: { _id: string }): ReactElement => {
	const t = useTranslation();

	const params = useMemo(() => ({ appId: _id }), [_id]);

	const getOauthApps = useEndpoint('GET', '/v1/oauth-apps.get');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, error, refetch } = useQuery(
		['oauth-apps', params],
		async () => {
			const oauthApps = await getOauthApps(params);
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
		return (
			<Box pb='x20' maxWidth='x600' w='full' alignSelf='center'>
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs='x8' />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs='x8'>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
	}

	if (error || !data || !_id) {
		return (
			<Box fontScale='h2' pb='x20'>
				{t('error-application-not-found')}
			</Box>
		);
	}

	return <EditOauthApp data={data.oauthApp} onChange={onChange} {...props} />;
};

export default EditOauthAppWithData;
