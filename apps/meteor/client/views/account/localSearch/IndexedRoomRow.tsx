import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { Box, Button } from '@rocket.chat/fuselage';
import { useFormatDateAndTime } from '@rocket.chat/ui-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { stopIndexingSearchRoom } from '../../../lib/e2ee/rocketchat.e2e';
import { Subscriptions } from '../../../stores';
import { useLocalSearchIndexRoomCoverage } from '../../room/contextualBar/MessageSearchTab/hooks/useLocalSearchIndexRoomCoverage';

export const roomLabel = (subscription: { fname?: string; name?: string } | undefined, rid: string) =>
	subscription?.fname || subscription?.name || rid;

/** A room that this device indexes: its name, how far back the index holds it, and the action that stops it. */
const IndexedRoomRow = ({ rid, backend }: { rid: string; backend: ISearchIndexBackend | undefined }) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const subscription = Subscriptions.use((state) => state.find((record) => record.rid === rid));
	const coverage = useLocalSearchIndexRoomCoverage(backend, rid, true);
	const [removing, setRemoving] = useState(false);

	let status: string | undefined;
	if (!subscription) {
		status = t('E2E_Local_Search_Room_Left');
	} else if (coverage?.done) {
		status = t('E2E_Local_Search_Room_Fully_Indexed');
	} else if (coverage?.since !== undefined) {
		status = t('E2E_Local_Search_Room_Indexed_Since_Short', { date: formatDateAndTime(coverage.since) });
	} else if (backend) {
		status = t('E2E_Local_Search_Room_Waiting');
	}

	return (
		<Box is='li' display='flex' alignItems='center' justifyContent='space-between' paddingBlock={8} data-qa='local-search-room'>
			<Box display='flex' flexDirection='column' minWidth={0} marginInlineEnd={8}>
				<Box fontScale='p2m' withTruncatedText>
					{roomLabel(subscription, rid)}
				</Box>
				{status && (
					<Box fontScale='c1' color='hint'>
						{status}
					</Box>
				)}
			</Box>
			<Button
				size='small'
				variant='secondary-danger'
				loading={removing}
				onClick={async () => {
					setRemoving(true);
					try {
						await stopIndexingSearchRoom(rid);
					} finally {
						setRemoving(false);
					}
				}}
			>
				{t('Remove')}
			</Button>
		</Box>
	);
};

export default IndexedRoomRow;
