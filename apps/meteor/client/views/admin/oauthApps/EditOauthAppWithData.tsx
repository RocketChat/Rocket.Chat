import { Box, Button, ButtonGroup, Skeleton, Throbber, InputBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';

import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import EditOauthApp from './EditOauthApp';

const EditOauthAppWithData = ({ _id, ...props }: { _id: string }): ReactElement => {
	const t = useTranslation();

	const params = useMemo(() => ({ appId: _id }), [_id]);

	const { value: data, phase: state, error, reload } = useEndpointData('/v1/oauth-apps.get', params);

	const onChange = useCallback(() => {
		reload();
	}, [reload]);

	if (state === AsyncStatePhase.LOADING) {
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
