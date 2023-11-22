import { Badge, Box, Button, ButtonGroup, Margins, ProgressBar, Throbber, Tabs } from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useTranslation, useStream, useRouter } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect, useState, useMemo } from 'react';

import {
	ProgressStep,
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ImportingErrorStates,
} from '../../../../app/importer/lib/ImporterProgressStep';
import { numberFormat } from '../../../../lib/utils/stringUtils';
import Page from '../../../components/Page';
import PrepareChannels from './PrepareChannels';
import PrepareImportFilters from './PrepareImportFilters';
import PrepareUsers from './PrepareUsers';
import { countMessages } from './countMessages';
import { useErrorHandler } from './useErrorHandler';

const waitFor = (fn, predicate) =>
	new Promise((resolve, reject) => {
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

function PrepareImportPage() {
	const t = useTranslation();
	const handleError = useErrorHandler();

	const [isPreparing, setPreparing] = useSafely(useState(true));
	const [progressRate, setProgressRate] = useSafely(useState(null));
	const [status, setStatus] = useSafely(useState(null));
	const [users, setUsers] = useState([]);
	const [channels, setChannels] = useState([]);
	const [messages, setMessages] = useState([]);
	const [isImporting, setImporting] = useSafely(useState(false));

	const [tab, setTab] = useState('users');
	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const [searchFilters, setSearchFilters] = useState('');
	const prevSearchFilterText = useRef(searchFilters);
	const searchText = useDebouncedValue(searchFilters, 500);

	useEffect(() => {
		prevSearchFilterText.current = searchText;
	}, [searchText]);

	const selectedUsers = useMemo(() => {
		return users.filter(({ do_import, username }) => (tab === 'users' ? username.includes(searchText) && do_import : do_import));
	}, [searchText, tab, users]);

	const selectedChannels = useMemo(() => {
		return channels.filter(({ do_import, name }) => (tab === 'channels' ? name.includes(searchText) && do_import : do_import));
	}, [channels, searchText, tab]);

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
			streamer('progress', ({ rate }) => {
				setProgressRate(rate);
			}),
		[streamer, setProgressRate],
	);

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

				setUsers(data.users.map((user) => ({ ...user, do_import: true })));
				setChannels(data.channels.map((channel) => ({ ...channel, do_import: true })));
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
	}, [getCurrentImportOperation, getImportFileData, handleError, messagesCount, router, setPreparing, setProgressRate, setStatus, t]);

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

	const statusDebounced = useDebouncedValue(status, 100);

	const handleMinimumImportData = !!(
		(!selectedUsers.length && !selectedChannels.length && !messagesCount) ||
		(!selectedUsers.length && !selectedChannels.length && messagesCount !== 0)
	);

	// TODO: when using the search bar, display only the results!

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

			<PrepareImportFilters setFilters={setSearchFilters} tab={tab} />

			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='x24' width='full' maxWidth='590px'>
					<Box is='h2' fontScale='p2m'>
						{statusDebounced && t(statusDebounced.replace('importer_', 'importer_status_'))}
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
										<ProgressBar percentage={progressRate.toFixed(0)} />
										<Box is='span' mis='x24'>
											{numberFormat(progressRate, 0)}%
										</Box>
									</Box>
								) : (
									<Throbber justifyContent='center' />
								)}
							</>
						)}
						{/* TODO: create filters for paginated results on PrepareUsers and PrepareChannels */}

						{!isPreparing && tab === 'users' && (
							<PrepareUsers usersCount={selectedUsers.length} users={users} setUsers={setUsers} searchText={searchText} />
						)}
						{!isPreparing && tab === 'channels' && (
							<PrepareChannels
								channels={channels}
								channelsCount={selectedChannels.length}
								setChannels={setChannels}
								searchText={searchText}
							/>
						)}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default PrepareImportPage;
