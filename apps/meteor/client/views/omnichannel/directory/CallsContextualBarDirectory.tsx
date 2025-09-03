import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEndpoint, useRoute, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import Call from './calls/Call';
import { VoipInfo } from './calls/contextualBar/VoipInfo';
import { ContextualbarSkeleton } from '../../../components/Contextualbar';
import { voipQueryKeys } from '../../../lib/queryKeys';

// TODO: We should render contextual bar components in this view
const CallsContextualBarDirectory = () => {
	const { t } = useTranslation();

	const rid = useRouteParameter('id') ?? '';
	const token = useSearchParameter('token') ?? '';
	const context = useRouteParameter('context');

	const directoryRoute = useRoute('omnichannel-directory');

	const handleClose = (): void => {
		directoryRoute.push({ tab: 'calls' });
	};

	const getVoipRoom = useEndpoint('GET', '/v1/voip/room');
	const { isPending, isError, data } = useQuery({
		queryKey: voipQueryKeys.room(rid, token),
		queryFn: () => getVoipRoom({ rid, token }),
	});

	if (context === 'view' && rid) {
		return <Call rid={rid} />;
	}

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isError || !data?.room) {
		return <Box mbs={16}>{t('Room_not_found')}</Box>;
	}

	const room = data.room as unknown as IVoipRoom; // TODO Check why types are incompatible even though the endpoint returns an IVoipRooms

	return context === 'info' ? <VoipInfo room={room} onClickClose={handleClose} /> : null;
};

export default CallsContextualBarDirectory;
