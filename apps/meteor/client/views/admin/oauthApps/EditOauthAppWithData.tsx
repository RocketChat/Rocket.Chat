import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

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
		return (
			<Box pb={20} maxWidth='x600' w='full' alignSelf='center'>
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<Skeleton mbs={8} />
				<InputBox.Skeleton w='full' />
				<ButtonGroup stretch w='full' mbs={8}>
					<Button disabled>
						<Throbber inheritColor />
					</Button>
					<Button primary disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
				<ButtonGroup stretch w='full' mbs={8}>
					<Button danger disabled>
						<Throbber inheritColor />
					</Button>
				</ButtonGroup>
			</Box>
		);
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
