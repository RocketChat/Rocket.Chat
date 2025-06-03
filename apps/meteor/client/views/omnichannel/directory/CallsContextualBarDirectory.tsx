import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Call from './calls/Call';
import { VoipInfo } from './calls/contextualBar/VoipInfo';
import { ContextualbarSkeleton } from '../../../components/Contextualbar';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';

// TODO: We should render contextual bar components in this view
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
		return <ContextualbarSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs={16}>{t('Room_not_found')}</Box>;
	}

	const room = data.room as unknown as IVoipRoom; // TODO Check why types are incompatible even though the endpoint returns an IVoipRooms

	return context === 'info' ? <VoipInfo room={room} onClickClose={handleClose} /> : null;
};

export default CallsContextualBarDirectory;
