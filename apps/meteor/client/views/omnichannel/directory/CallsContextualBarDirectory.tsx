import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useSearchParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useMemo } from 'react';

import { Contextualbar } from '../../../components/Contextualbar';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import Call from './calls/Call';
import { VoipInfo } from './calls/contextualBar/VoipInfo';
import { FormSkeleton } from './components/FormSkeleton';

const CallsContextualBarDirectory: FC = () => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');
	const token = useSearchParameter('token');

	const t = useTranslation();

	const handleCallsContextualbarCloseButtonClick = (): void => {
		directoryRoute.push({ page: 'calls' });
	};

	const query = useMemo(
		() => ({
			rid: id || '',
			token: token || '',
		}),
		[id, token],
	);

	const { value: data, phase: state, error } = useEndpointData(`/v1/voip/room`, { params: query });

	if (bar === 'view' && id) {
		return <Call rid={id} />;
	}

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box pi={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (error || !data || !data.room) {
		return <Box mbs={16}>{t('Room_not_found')}</Box>;
	}

	const room = data.room as unknown as IVoipRoom; // TODO Check why types are incompatible even though the endpoint returns an IVoipRooms

	return (
		<Contextualbar>{bar === 'info' && <VoipInfo room={room} onClickClose={handleCallsContextualbarCloseButtonClick} />}</Contextualbar>
	);
};

export default CallsContextualBarDirectory;
