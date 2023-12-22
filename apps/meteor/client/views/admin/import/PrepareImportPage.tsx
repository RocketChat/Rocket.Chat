import type { IImport, IImporterSelection, Serialized } from '@rocket.chat/core-typings';
import type { IImporterSelectionMessage } from '@rocket.chat/core-typings/dist/import/IImporterSelectionMessage';
import { Badge, Box, Button, ButtonGroup, Margins, ProgressBar, Throbber, Tabs } from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation, useStream, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, useMemo } from 'react';

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
import type { ChannelDescriptor } from './ChannelDescriptor';
import PrepareChannels from './PrepareChannels';
import PrepareUsers from './PrepareUsers';
import type { UserDescriptor } from './UserDescriptor';
import { countMessages } from './countMessages';
import { useErrorHandler } from './useErrorHandler';

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
	const [users, setUsers] = useState<UserDescriptor[]>([]);
	const [channels, setChannels] = useState<ChannelDescriptor[]>([]);
	const [messages, setMessages] = useState<IImporterSelectionMessage[]>([]);
	const [isImporting, setImporting] = useSafely(useState(false));

	const selectedUsers = useMemo(() => {
		return users.filter(({ do_import }) => do_import);
	}, [users]);

	const selectedChannels = useMemo(() => {
		return channels.filter(({ do_import }) => do_import);
	}, [channels]);

	const messagesCount = useMemo(() => {
		return countMessages(selectedUsers, selectedChannels, messages);
	}, [selectedUsers, selectedChannels, messages]);
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

				setUsers(data.users.map((user) => ({ ...user, username: user.username ?? '', do_import: true })));
				setChannels(data.channels.map((channel) => ({ ...channel, name: channel.name ?? '', do_import: true })));
				setMessages(data.messages);
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
	}, [getCurrentImportOperation, getImportFileData, handleError, router, setPreparing, setProgressRate, setStatus, t]);

	const handleStartButtonClick = async () => {
		setImporting(true);

		try {
			await startImport({
				input: {
					users: users.map((user) => ({ is_bot: false, is_email_taken: false, ...user })),
					channels: channels.map((channel) => ({ is_private: false, is_direct: false, ...channel })),
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
		(!selectedUsers.length && !selectedChannels.length && !messagesCount) ||
		(!selectedUsers.length && !selectedChannels.length && messagesCount !== 0)
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
								{t('Users')} <Badge>{selectedUsers.length}</Badge>
							</Tabs.Item>
							<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>
								{t('Channels')} <Badge>{selectedChannels.length}</Badge>
							</Tabs.Item>
							<Tabs.Item disabled>
								{t('Messages')}
								<Badge>{messagesCount}</Badge>
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
						{!isPreparing && tab === 'users' && <PrepareUsers usersCount={selectedUsers.length} users={users} setUsers={setUsers} />}
						{!isPreparing && tab === 'channels' && (
							<PrepareChannels channels={channels} channelsCount={selectedChannels.length} setChannels={setChannels} />
						)}
					</Margins>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
}

export default PrepareImportPage;
