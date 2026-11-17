import { Box, Button, Callout, Tag } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { startIndexingSearchRoom } from '../../../../../lib/e2ee/rocketchat.e2e';
import LocalSearchIndexStatusPanel from '../layout/LocalSearchIndexStatusPanel';

/**
 * Shown in the search of an encrypted room that this device does not index. The user decides which rooms the device
 * indexes: nothing of this room is indexed until the user starts it here or in the account page.
 */
const LocalSearchIndexRoomPrompt = ({ rid }: { rid: string }) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<LocalSearchIndexStatusPanel>
			<Callout type='info' title={t('E2E_Local_Search_Room_Not_Chosen_Title')} data-qa='local-search-room-prompt'>
				<Box display='flex' flexDirection='column' gap={8}>
					<Box>{t('E2E_Local_Search_Room_Not_Chosen_Description')}</Box>
					<Box display='flex' alignItems='center' gap={8}>
						<Button size='small' variant='primary' onClick={() => startIndexingSearchRoom(rid)}>
							{t('E2E_Local_Search_Index_Room')}
						</Button>
						<Button size='small' variant='secondary' onClick={() => router.navigate('/account/local-search')}>
							{t('E2E_Local_Search_Open_Settings')}
						</Button>
						<Tag variant='featured'>{t('Experimental')}</Tag>
					</Box>
				</Box>
			</Callout>
		</LocalSearchIndexStatusPanel>
	);
};

export default LocalSearchIndexRoomPrompt;
