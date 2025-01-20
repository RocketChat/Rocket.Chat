import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Call from './calls/Call';
import { VoipInfo } from './calls/contextualBar/VoipInfo';
import { FormSkeleton } from './components/FormSkeleton';
import { Contextualbar } from '../../../components/Contextualbar';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';

const CallsContextualBarDirectory = () => {
	const { t } = useTranslation();

	const id = useRouteParameter('id');
	const token = useSearchParameter('token');
	const context = useRouteParameter('context');

	const directoryRoute = useRoute('omnichannel-directory');

	const handleClose = (): void => {
		directoryRoute.push({ tab: 'calls' });
	};

	const query = useMemo(
		() => ({
			rid: id || '',
			token: token || '',
		}),
		[id, token],
	);

	const { value: data, phase: state, error } = useEndpointData(`/v1/voip/room`, { params: query });

	if (context === 'view' && id) {
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

	return <Contextualbar>{context === 'info' && <VoipInfo room={room} onClickClose={handleClose} />}</Contextualbar>;
};

export default CallsContextualBarDirectory;
