import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useQueryStringParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from './Skeleton';
import Call from './calls/Call';
import { VoipInfo } from './calls/contextualBar/VoipInfo';

const CallsContextualBarDirectory: FC = () => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');
	const token = useQueryStringParameter('token');

	const t = useTranslation();

	const handleCallsVerticalBarCloseButtonClick = (): void => {
		directoryRoute.push({ page: 'calls' });
	};

	const query = useMemo(
		() => ({
			rid: id || '',
			token: token || '',
		}),
		[id, token],
	);

	const { value: data, phase: state, error } = useEndpointData(`voip/room`, query);

	if (bar === 'view' && id) {
		return <Call rid={id} />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box pi='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	const room = data.room as unknown as IVoipRoom; // TODO Check why types are incompatible even though the endpoint returns an IVoipRooms

	return (
		<VerticalBar className={'contextual-bar'}>
			{bar === 'info' && <VoipInfo room={room} onClickClose={handleCallsVerticalBarCloseButtonClick} />}
		</VerticalBar>
	);
};

export default CallsContextualBarDirectory;
