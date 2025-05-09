import type { IImport, IImporterSelection, IImporterSelectionContact, Serialized } from '@rocket.chat/core-typings';
import { Badge, Box, Button, ButtonGroup, Margins, ProgressBar, Throbber, Tabs } from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation, useStream, useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useMemo } from 'react';

import type { ChannelDescriptor } from './ChannelDescriptor';
import PrepareChannels from './PrepareChannels';
import PrepareContacts from './PrepareContacts';
import PrepareUsers from './PrepareUsers';
import type { UserDescriptor } from './UserDescriptor';
import { useErrorHandler } from './useErrorHandler';
import {
	ProgressStep,
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ImportingErrorStates,
} from '../../../../app/importer/lib/ImporterProgressStep';
import { numberFormat } from '../../../../lib/utils/stringUtils';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';

const waitFor = <T, U extends T>(fn: () => Promise<T>, predicate: (arg: T) => arg is U) =>
	new Promise<U>((resolve, reject) => {
		const callPromise = () => {
			fn().then((result) => {
				if (predicate(result)) {
					resolve(result);
					return;
				}

				setTimeout(callPromise, 1000);
			}, reject);
		};

		callPromise();
	});

// TODO: review inner logic
function PrepareImportPage() {
	const t = useTranslation();
	const handleError = useErrorHandler();

	const [isPreparing, setPreparing] = useSafely(useState(true));
	const [progressRate, setProgressRate] = useSafely(useState<number | null>(null));
	const [status, setStatus] = useSafely(useState<string | null>(null));
	const [messageCount, setMessageCount] = useSafely(useState(0));
	const [users, setUsers] = useState<UserDescriptor[]>([]);
	const [contacts, setContacts] = useState<IImporterSelectionContact[]>([]);
	const [channels, setChannels] = useState<ChannelDescriptor[]>([]);
	const [isImporting, setImporting] = useSafely(useState(false));

	const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);
	const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);
	const contactsCount = useMemo(() => contacts.filter(({ do_import }) => do_import).length, [contacts]);

	const router = useRouter();

	const getImportFileData = useEndpoint('GET', '/v1/getImportFileData');
	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const startImport = useEndpoint('POST', '/v1/startImport');

	const streamer = useStream('importers');

	useEffect(
		() =>
			streamer('progress', (progress) => {
				// Ignore any update without the rate since we're not showing any other info anyway
				if ('rate' in progress) {
					setProgressRate(progress.rate);
				}
			}),
		[streamer, setProgressRate],
	);

	useEffect(() => {
		const loadImportFileData = async () => {
			try {
				const data = await waitFor(
					getImportFileData,
					(data): data is IImporterSelection => data && (!('waiting' in data) || !data.waiting),
				);

				if (!data) {
					handleError(t('Importer_not_setup'));
					router.navigate('/admin/import');
					return;
				}

				setMessageCount(data.message_count);
				setUsers(data.users.map((user) => ({ ...user, username: user.username ?? '', do_import: true })));
				setChannels(data.channels.map((channel) => ({ ...channel, name: channel.name ?? '', do_import: true })));
				setContacts(data.contacts?.map((contact) => ({ ...contact, name: contact.name ?? '', do_import: true })) || []);
				setPreparing(false);
				setProgressRate(null);
			} catch (error) {
				handleError(error, t('Failed_To_Load_Import_Data'));
				router.navigate('/admin/import');
			}
		};

		const loadCurrentOperation = async () => {
			try {
				const { operation } = await waitFor(
					getCurrentImportOperation,
					(data): data is Serialized<{ operation: IImport }> =>
						data.operation.valid && !ImportWaitingStates.includes(data.operation.status),
				);

				if (!operation.valid) {
					router.navigate('/admin/import/new');
					return;
				}

				if (ImportingStartedStates.includes(operation.status)) {
					router.navigate('/admin/import/progress');
					return;
				}

				if (
					operation.status === ProgressStep.USER_SELECTION ||
					ImportPreparingStartedStates.includes(operation.status) ||
					ImportFileReadyStates.includes(operation.status)
				) {
					setStatus(operation.status);
					loadImportFileData();
					return;
				}

				if (ImportingErrorStates.includes(operation.status)) {
					handleError(t('Import_Operation_Failed'));
					router.navigate('/admin/import');
					return;
				}

				if (operation.status === ProgressStep.DONE) {
					router.navigate('/admin/import');
					return;
				}

				handleError(t('Unknown_Import_State'));
				router.navigate('/admin/import');
			} catch (error) {
				handleError(t('Failed_To_Load_Import_Data'));
				router.navigate('/admin/import');
			}
		};

		loadCurrentOperation();
	}, [getCurrentImportOperation, getImportFileData, handleError, router, setMessageCount, setPreparing, setProgressRate, setStatus, t]);

	const handleStartButtonClick = async () => {
		setImporting(true);

		try {
			const usersToImport = users.filter(({ do_import }) => do_import).map(({ user_id }) => user_id);
			const channelsToImport = channels.filter(({ do_import }) => do_import).map(({ channel_id }) => channel_id);
			const contactsToImport = contacts.filter(({ do_import }) => do_import).map(({ id }) => id);

			await startImport({
				input: {
					users: {
						all: users.length > 0 && usersToImport.length === users.length,
						list: (usersToImport.length !== users.length && usersToImport) || undefined,
					},
					channels: {
						all: channels.length > 0 && channelsToImport.length === channels.length,
						list: (channelsToImport.length !== channels.length && channelsToImport) || undefined,
					},
					contacts: {
						all: contacts.length > 0 && contactsToImport.length === contacts.length,
						list: (contactsToImport.length !== contacts.length && contactsToImport) || undefined,
					},
				},
			});
			router.navigate('/admin/import/progress');
		} catch (error) {
			handleError(error, t('Failed_To_Start_Import'));
			router.navigate('/admin/import');
		}
	};

	const [tab, setTab] = useState('users');
	const handleTabClick = useMemo(() => (tab: string) => () => setTab(tab), []);

	const statusDebounced = useDebouncedValue(status, 100);

	const handleMinimumImportData = !!(
		(!usersCount && !channelsCount && !contactsCount && !messageCount) ||
		(!usersCount && !channelsCount && !contactsCount && messageCount !== 0)
	);

	return (
		<Page>
			<PageHeader title={t('Importing_Data')} onClickBack={() => router.navigate('/admin/import')}>
				<ButtonGroup>
					<Button primary disabled={isImporting || handleMinimumImportData} onClick={handleStartButtonClick}>
						{t('Importer_Prepare_Start_Import')}
					</Button>
				</ButtonGroup>
			</PageHeader>
			<PageScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='x24' width='full' maxWidth='590px'>
					<Box is='h2' fontScale='p2m'>
						{statusDebounced && t(statusDebounced.replace('importer_', 'importer_status_') as TranslationKey)}
					</Box>
					{!isPreparing && (
						<Tabs flexShrink={0}>
							<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>
								{t('Users')} <Badge>{usersCount}</Badge>
							</Tabs.Item>
							<Tabs.Item selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>
								{t('Contacts')} <Badge>{contactsCount}</Badge>
							</Tabs.Item>
							<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>
								{t('Channels')} <Badge>{channelsCount}</Badge>
							</Tabs.Item>
							<Tabs.Item disabled>
								{t('Messages')}
								<Badge>{messageCount}</Badge>
							</Tabs.Item>
						</Tabs>
					)}
					<Margins block='x24'>
						{isPreparing && (
							<>
								{progressRate ? (
									<Box display='flex' justifyContent='center' fontScale='p2'>
										<ProgressBar percentage={Math.floor(progressRate)} />
										<Box is='span' mis='x24'>
											{numberFormat(progressRate, 0)}%
										</Box>
									</Box>
								) : (
									<Throbber justifyContent='center' />
								)}
							</>
						)}
						{!isPreparing && tab === 'users' && <PrepareUsers usersCount={usersCount} users={users} setUsers={setUsers} />}
						{!isPreparing && tab === 'contacts' && (
							<PrepareContacts contactsCount={contactsCount} contacts={contacts} setContacts={setContacts} />
						)}
						{!isPreparing && tab === 'channels' && (
							<PrepareChannels channels={channels} channelsCount={channelsCount} setChannels={setChannels} />
						)}
					</Margins>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default PrepareImportPage;
