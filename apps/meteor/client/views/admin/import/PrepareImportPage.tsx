import type { IImport, IImporterSelection, IImporterSelectionContact, Serialized } from '@rocket.chat/core-typings';
import { Badge, Box, Button, ButtonGroup, Margins, ProgressBar, Throbber, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation, useStream, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';
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

const isOperationReady = (data?: Serialized<{ operation: IImport }>): data is Serialized<{ operation: IImport }> =>
	!!data && data.operation.valid && !ImportWaitingStates.includes(data.operation.status);

const isSelectionReady = (data?: Serialized<IImporterSelection | { waiting: true }>): data is Serialized<IImporterSelection> =>
	!!data && (!('waiting' in data) || !data.waiting);

const isPreparingStatus = (status: IImport['status']) =>
	status === ProgressStep.USER_SELECTION || ImportPreparingStartedStates.includes(status) || ImportFileReadyStates.includes(status);

const getOperationRedirect = (status: IImport['status']): { path: '/admin/import' | '/admin/import/progress'; error?: TranslationKey } => {
	if (ImportingStartedStates.includes(status)) {
		return { path: '/admin/import/progress' };
	}

	if (ImportingErrorStates.includes(status)) {
		return { path: '/admin/import', error: 'Import_Operation_Failed' };
	}

	if (status === ProgressStep.DONE) {
		return { path: '/admin/import' };
	}

	return { path: '/admin/import', error: 'Unknown_Import_State' };
};

/** Local edits on top of a value derived from server data; falls back to that value until the first edit. */
const useDraft = <T,>(initial: T): [T, Dispatch<SetStateAction<T>>] => {
	const [draft, setDraft] = useState<T>();
	const setValue = useStableCallback((action: SetStateAction<T>) =>
		setDraft((prev) => (typeof action === 'function' ? (action as (prev: T) => T)(prev ?? initial) : action)),
	);
	return [draft ?? initial, setValue];
};

// TODO: review inner logic
function PrepareImportPage() {
	const t = useTranslation();
	const handleError = useErrorHandler();

	const [progressRate, setProgressRate] = useState<number | null>(null);
	const [isImporting, setImporting] = useState(false);

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
		[streamer],
	);

	const operationQuery = useQuery({
		queryKey: ['PrepareImportPage', 'currentOperation'],
		queryFn: () => getCurrentImportOperation(),
		refetchInterval: ({ state }) => (isOperationReady(state.data) ? false : 1000),
		retry: false,
		gcTime: 0,
	});

	const operationStatus = isOperationReady(operationQuery.data) ? operationQuery.data.operation.status : undefined;
	const status = operationStatus && isPreparingStatus(operationStatus) ? operationStatus : null;

	const fileDataQuery = useQuery({
		queryKey: ['PrepareImportPage', 'fileData'],
		queryFn: () => getImportFileData(),
		enabled: !!status,
		refetchInterval: ({ state }) => (isSelectionReady(state.data) ? false : 1000),
		retry: false,
		gcTime: 0,
	});

	const fileData = isSelectionReady(fileDataQuery.data) ? fileDataQuery.data : undefined;
	const isPreparing = !fileData;
	const messageCount = fileData?.message_count ?? 0;

	const [users, setUsers] = useDraft<UserDescriptor[]>(
		useMemo(() => fileData?.users.map((user) => ({ ...user, username: user.username ?? '', do_import: true })) ?? [], [fileData]),
	);
	const [channels, setChannels] = useDraft<ChannelDescriptor[]>(
		useMemo(() => fileData?.channels.map((channel) => ({ ...channel, name: channel.name ?? '', do_import: true })) ?? [], [fileData]),
	);
	const [contacts, setContacts] = useDraft<IImporterSelectionContact[]>(
		useMemo(() => fileData?.contacts?.map((contact) => ({ ...contact, name: contact.name ?? '', do_import: true })) ?? [], [fileData]),
	);

	const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);
	const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);
	const contactsCount = useMemo(() => contacts.filter(({ do_import }) => do_import).length, [contacts]);

	useEffect(() => {
		if (operationQuery.isError) {
			handleError(t('Failed_To_Load_Import_Data'));
			router.navigate('/admin/import');
			return;
		}

		if (fileDataQuery.isError) {
			handleError(fileDataQuery.error, t('Failed_To_Load_Import_Data'));
			router.navigate('/admin/import');
			return;
		}

		if (!operationStatus || isPreparingStatus(operationStatus)) {
			return;
		}

		const { path, error } = getOperationRedirect(operationStatus);
		if (error) {
			handleError(t(error));
		}
		router.navigate(path);
	}, [fileDataQuery.error, fileDataQuery.isError, handleError, operationQuery.isError, operationStatus, router, t]);

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
							<TabsItem selected={tab === 'users'} onClick={handleTabClick('users')}>
								{t('Users')} <Badge>{usersCount}</Badge>
							</TabsItem>
							<TabsItem selected={tab === 'contacts'} onClick={handleTabClick('contacts')}>
								{t('Contacts')} <Badge>{contactsCount}</Badge>
							</TabsItem>
							<TabsItem selected={tab === 'channels'} onClick={handleTabClick('channels')}>
								{t('Channels')} <Badge>{channelsCount}</Badge>
							</TabsItem>
							<TabsItem disabled>
								{t('Messages')}
								<Badge>{messageCount}</Badge>
							</TabsItem>
						</Tabs>
					)}
					<Margins block='x24'>
						{isPreparing && (
							<>
								{progressRate ? (
									<Box display='flex' justifyContent='center' fontScale='p2'>
										<ProgressBar percentage={Math.floor(progressRate)} />
										<Box is='span' marginInlineStart='x24'>
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
