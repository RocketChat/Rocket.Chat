import { Box } from '@rocket.chat/fuselage';
import React, { FC, useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { FormSkeleton } from './Skeleton';
import Call from './calls/Call';
// import CallInfoDirectory from './calls/contextualBar/CallInfoDirectory';
// import RoomEditWithData from './calls/contextualBar/RoomEditWithData';

const CallsContextualBar: FC<{ callReload?: () => void }> = ({ callReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');

	const t = useTranslation();

	const openInRoom = (): void => {
		id && directoryRoute.push({ page: 'calls', id, bar: 'view' });
	};

	const handleCallsVerticalBarCloseButtonClick = (): void => {
		directoryRoute.push({ page: 'calls' });
	};

	const handleCallsVerticalBarBackButtonClick = (): void => {
		id && directoryRoute.push({ page: 'calls', id, bar: 'info' });
	};

	const query = useMemo(
		() => ({
			roomId: id || '',
		}),
		[id],
	);

	const { value: data, phase: state, error, reload: reloadInfo } = useEndpointData(`rooms.info`, query);

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

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{bar === 'info' && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
						<VerticalBar.Action title={t('View_full_conversation')} name={'new-window'} onClick={openInRoom} />
					</>
				)}
				{bar === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleCallsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{/* {bar === 'info' && <CallInfoDirectory id={id} room={data.room} />}
			{bar === 'edit' && (
				<RoomEditWithData id={id} close={handleCallsVerticalBarBackButtonClick} reload={callReload} reloadInfo={reloadInfo} />
			)} */}
		</VerticalBar>
	);
};

export default CallsContextualBar;
