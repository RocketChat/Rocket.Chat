import { Button, ButtonGroup, Callout, FieldDescription, FieldGroup, Stack, Tag, Text } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import AddRoomField from './AddRoomField';
import IndexedRoomRow from './IndexedRoomRow';
import PreferenceNumberField, { numberPreferences } from './PreferenceNumberField';
import ContentColumn from '../../../components/ContentColumn';
import { useE2EESearchPreferences } from '../../../hooks/useE2EESearchPreferences';
import { stopIndexingSearchRoom } from '../../../lib/e2ee/rocketchat.e2e';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { useLocalSearchIndexBackend } from '../../room/contextualBar/MessageSearchTab/hooks/useLocalSearchIndexBackend';
import LocalSearchOptIn from '../security/LocalSearchOptIn';

/** The account page of the local search of encrypted messages on this device. */
const AccountLocalSearchPage = () => {
	const { t } = useTranslation();
	const preferences = useE2EESearchPreferences();
	const backend = useLocalSearchIndexBackend();
	const available = !!getSearchIndexBackend();

	return (
		<Page>
			<PageHeader
				title={
					<Stack direction='row' align='center' gap='x8'>
						{t('E2E_Local_Search_Page_Title')}
						<Tag variant='featured'>{t('Experimental')}</Tag>
					</Stack>
				}
			/>
			<PageScrollableContentWithShadow>
				<ContentColumn>
					<Stack gap='x32'>
						<Stack gap='x16'>
							<Callout type='warning' title={t('Experimental')}>
								{t('E2E_Local_Search_Experimental_Description')}
							</Callout>
							{available ? <LocalSearchOptIn /> : <Callout type='info'>{t('E2E_Local_Search_Not_Available')}</Callout>}
						</Stack>
						{available && (
							<>
								<Stack is='section' gap='x8'>
									<Text is='h3' fontScale='h4'>
										{t('E2E_Local_Search_Indexed_Rooms')}
									</Text>
									<FieldDescription>{t('E2E_Local_Search_Indexed_Rooms_Description')}</FieldDescription>
									{preferences.rooms.length === 0 ? (
										<Text fontScale='p2' color='hint'>
											{t('E2E_Local_Search_No_Indexed_Rooms')}
										</Text>
									) : (
										<Stack is='ul'>
											{preferences.rooms.map((rid) => (
												<IndexedRoomRow key={rid} rid={rid} backend={backend} />
											))}
										</Stack>
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
									<FieldGroup>
										<AddRoomField chosen={preferences.rooms} />
									</FieldGroup>
								</Stack>
								<Stack is='section' gap='x8'>
									<Text is='h3' fontScale='h4'>
										{t('E2E_Local_Search_Indexing_Pace')}
									</Text>
									<FieldDescription>{t('E2E_Local_Search_Indexing_Pace_Description')}</FieldDescription>
									<FieldGroup>
										{numberPreferences.map((preference) => (
											<PreferenceNumberField key={preference.field} {...preference} />
										))}
									</FieldGroup>
								</Stack>
							</>
						)}
					</Stack>
				</ContentColumn>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AccountLocalSearchPage;
