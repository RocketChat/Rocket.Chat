import type { IImportProgress } from '@rocket.chat/core-typings';
import { ProgressStep } from '@rocket.chat/core-typings';
import { Badge, Box, Button, ButtonGroup, Margins, Throbber, Tabs, ProgressBar } from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation, useStream, useRouter } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState, useMemo } from 'react';

import {
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ImportingErrorStates,
} from '../../../../app/importer/lib/ImporterProgressStep';
import { numberFormat } from '../../../../lib/utils/stringUtils';
import Page from '../../../components/Page';
import PrepareChannels from './PrepareChannels';
import PrepareUsers from './PrepareUsers';
import { useErrorHandler } from './useErrorHandler';

const waitFor = (
	fn: {
		(params?: unknown): Promise<
			| {
					name: string;
					users: {
						user_id: string;
						username: string | undefined;
						email: string;
						is_deleted: boolean;
						is_bot: boolean;
						do_import: boolean;
						is_email_taken: boolean;
					}[];
					channels: {
						channel_id: string;
						name: string | undefined;
						is_archived: boolean;
						do_import: boolean;
						is_private: boolean;
						creator: undefined;
						is_direct: boolean;
					}[];
					message_count: number;
			  }
			| { waiting: true }
		>;
		(params?: unknown): Promise<{
			operation: {
				type: string;
				importerKey: string;
				ts: string;
				status: ProgressStep;
				valid: boolean;
				user: string;
				_updatedAt: string;
				contentType?: string | undefined;
				file?: string | undefined;
				count?:
					| {
							total?: number | undefined;
							completed?: number | undefined;
							error?: number | undefined;
							users?: number | undefined;
							messages?: number | undefined;
							channels?: number | undefined;
					  }
					| undefined;
				_id: string;
			};
		}>;
		(): Promise<unknown>;
	},
	predicate: (result: unknown) => boolean,
) =>
	new Promise((resolve, reject) => {
		const callPromise = () => {
			fn().then((result: unknown) => {
				if (predicate(result)) {
					resolve(result);
					return;
				}

				setTimeout(callPromise, 1000);
			}, reject);
		};

		callPromise();
	});

function PrepareImportPage() {
	const t = useTranslation();
	const handleError = useErrorHandler();

	const [isPreparing, setPreparing] = useSafely(useState(true));
	const [progressRate, setProgressRate] = useSafely(useState<{ rate: number } | IImportProgress>());
	const [status, setStatus] = useSafely(useState(null));
	const [messageCount, setMessageCount] = useSafely(useState(0));
	const [users, setUsers] = useState([]);
	const [channels, setChannels] = useState([]);
	const [isImporting, setImporting] = useSafely(useState(false));

	const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);
	const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);

	const router = useRouter();

	const getImportFileData = useEndpoint('GET', '/v1/getImportFileData');
	const getCurrentImportOperation = useEndpoint('GET', '/v1/getCurrentImportOperation');
	const startImport = useEndpoint('POST', '/v1/startImport');

	const streamer = useStream('importers');

	useEffect(() => streamer('progress', (event: { rate: number } | IImportProgress) => setProgressRate(event)), [streamer, setProgressRate]);

	useEffect(() => {
		const loadImportFileData = async () => {
			try {
				const data = await waitFor(getImportFileData, (data) => data && !data.waiting);

				if (!data) {
					handleError(t('Importer_not_setup'));
					router.navigate('/admin/import');
					return;
				}

				if (data.step) {
					handleError(t('Failed_To_Load_Import_Data'));
					router.navigate('/admin/import');
					return;
				}

				setMessageCount(data.message_count);
				setUsers(data.users.map((user) => ({ ...user, do_import: true })));
				setChannels(data.channels.map((channel) => ({ ...channel, do_import: true })));
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
					({ operation }) => operation.valid && !ImportWaitingStates.includes(operation.status),
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

	const handleBackToImportsButtonClick = () => {
		router.navigate('/admin/import');
	};

	const handleStartButtonClick = async () => {
		setImporting(true);

		try {
			await startImport({ input: { users, channels } });
			router.navigate('/admin/import/progress');
		} catch (error) {
			handleError(error, t('Failed_To_Start_Import'));
			router.navigate('/admin/import');
		}
	};

	const [tab, setTab] = useState('users');
	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const statusDebounced = useDebouncedValue(status, 100);

	const handleMinimumImportData = !!(
		(!usersCount && !channelsCount && !messageCount) ||
		(!usersCount && !channelsCount && messageCount !== 0)
	);

	return (
		<Page>
			<Page.Header title={t('Importing_Data')}>
				<ButtonGroup>
					<Button icon='back' secondary onClick={handleBackToImportsButtonClick}>
						{t('Back_to_imports')}
					</Button>
					<Button primary disabled={isImporting || handleMinimumImportData} onClick={handleStartButtonClick}>
						{t('Importer_Prepare_Start_Import')}
					</Button>
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='x24' width='full' maxWidth='590px'>
					<Box is='h2' fontScale='p2m'>
						{statusDebounced && t(statusDebounced.replace('importer_', 'importer_status_'))}
					</Box>
					{!isPreparing && (
						<Tabs flexShrink={0}>
							<Tabs.Item selected={tab === 'users'} onClick={handleTabClick('users')}>
								{t('Users')} <Badge>{usersCount}</Badge>
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
										<Box is={ProgressBar} animated percentage={(progressRate * 10).toFixed(0)} mie='x24' />
										<Box is='span'>{numberFormat(progressRate, 0)}%</Box>
									</Box>
								) : (
									<Throbber justifyContent='center' />
								)}
							</>
						)}
						{!isPreparing && tab === 'users' && <PrepareUsers usersCount={usersCount} users={users} setUsers={setUsers} />}
						{!isPreparing && tab === 'channels' && (
							<PrepareChannels channels={channels} channelsCount={channelsCount} setChannels={setChannels} />
						)}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default PrepareImportPage;
