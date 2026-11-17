import { Box, Button, ButtonGroup, Callout, FieldDescription, FieldGroup, Tag } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AddRoomField from './AddRoomField';
import IndexedRoomRow from './IndexedRoomRow';
import PreferenceNumberField, { numberPreferences } from './PreferenceNumberField';
import { useE2EESearchPreferences } from '../../../hooks/useE2EESearchPreferences';
import { stopIndexingSearchRoom } from '../../../lib/e2ee/rocketchat.e2e';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { useLocalSearchIndexBackend } from '../../room/contextualBar/MessageSearchTab/hooks/useLocalSearchIndexBackend';
import LocalSearchOptIn from '../security/LocalSearchOptIn';

/**
 * The account page of the local search of encrypted messages (experimental): the opt-in, the rooms that this device
 * indexes, and how it indexes their history. Everything here is stored on this device only.
 */
const AccountLocalSearchPage = () => {
	const { t } = useTranslation();
	const preferences = useE2EESearchPreferences();
	const backend = useLocalSearchIndexBackend();
	const available = !!getSearchIndexBackend();

	return (
		<Page>
			<PageHeader
				title={
					<Box display='flex' alignItems='center'>
						{t('E2E_Local_Search_Page_Title')}
						<Box marginInlineStart={8}>
							<Tag variant='featured'>{t('Experimental')}</Tag>
						</Box>
					</Box>
				}
			/>
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' width='full' alignSelf='center' color='default'>
					<Callout type='warning' title={t('Experimental')}>
						{t('E2E_Local_Search_Experimental_Description')}
					</Callout>
					{!available && (
						<Box marginBlockStart={16}>
							<Callout type='info'>{t('E2E_Local_Search_Not_Available')}</Callout>
						</Box>
					)}
					{available && (
						<>
							<LocalSearchOptIn />
							<Box is='h3' fontScale='h4' marginBlockStart={32} marginBlockEnd={8}>
								{t('E2E_Local_Search_Indexed_Rooms')}
							</Box>
							<FieldDescription>{t('E2E_Local_Search_Indexed_Rooms_Description')}</FieldDescription>
							{preferences.rooms.length === 0 ? (
								<Box fontScale='p2' color='hint' paddingBlock={8}>
									{t('E2E_Local_Search_No_Indexed_Rooms')}
								</Box>
							) : (
								<Box is='ul' paddingBlock={8}>
									{preferences.rooms.map((rid) => (
										<IndexedRoomRow key={rid} rid={rid} backend={backend} />
									))}
								</Box>
							)}
							{preferences.rooms.length > 1 && (
								<ButtonGroup>
									<Button
										size='small'
										variant='secondary-danger'
										onClick={async () => {
											for (const rid of preferences.rooms) {
												await stopIndexingSearchRoom(rid);
											}
										}}
									>
										{t('E2E_Local_Search_Remove_All_Rooms')}
									</Button>
								</ButtonGroup>
							)}
							<Box marginBlockStart={16}>
								<FieldGroup>
									<AddRoomField chosen={preferences.rooms} />
								</FieldGroup>
							</Box>
							<Box is='h3' fontScale='h4' marginBlockStart={32} marginBlockEnd={8}>
								{t('E2E_Local_Search_Indexing_Pace')}
							</Box>
							<FieldDescription>{t('E2E_Local_Search_Indexing_Pace_Description')}</FieldDescription>
							<Box marginBlockStart={16}>
								<FieldGroup>
									{numberPreferences.map((preference) => (
										<PreferenceNumberField key={preference.field} {...preference} />
									))}
								</FieldGroup>
							</Box>
						</>
					)}
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AccountLocalSearchPage;
