import {
	Badge,
	Box,
	Button,
	ButtonGroup,
	Icon,
	Margins,
	Throbber,
	Tabs,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState, useMemo } from 'react';
import s from 'underscore.string';

import {
	ProgressStep,
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ImportingErrorStates,
} from '../../../../app/importer/lib/ImporterProgressStep';
import Page from '../../../components/Page';
import { useRoute } from '../../../contexts/RouterContext';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import PrepareChannels from './PrepareChannels';
import PrepareUsers from './PrepareUsers';
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
	const [messageCount, setMessageCount] = useSafely(useState(0));
	const [users, setUsers] = useState([]);
	const [channels, setChannels] = useState([]);
	const [isImporting, setImporting] = useSafely(useState(false));

	const usersCount = useMemo(() => users.filter(({ do_import }) => do_import).length, [users]);
	const channelsCount = useMemo(
		() => channels.filter(({ do_import }) => do_import).length,
		[channels],
	);

	const importHistoryRoute = useRoute('admin-import');
	const newImportRoute = useRoute('admin-import-new');
	const importProgressRoute = useRoute('admin-import-progress');

	const getImportFileData = useEndpoint('GET', 'getImportFileData');
	const getCurrentImportOperation = useEndpoint('GET', 'getCurrentImportOperation');
	const startImport = useEndpoint('POST', 'startImport');

	useEffect(() => {
		const streamer = new Meteor.Streamer('importers');

		const handleProgressUpdated = ({ rate }) => {
			setProgressRate(rate);
		};

		streamer.on('progress', handleProgressUpdated);

		return () => {
			streamer.removeListener('progress', handleProgressUpdated);
		};
	}, [setProgressRate]);

	useEffect(() => {
		const loadImportFileData = async () => {
			try {
				const data = await waitFor(getImportFileData, (data) => data && !data.waiting);

				if (!data) {
					handleError(t('Importer_not_setup'));
					importHistoryRoute.push();
					return;
				}

				if (data.step) {
					handleError(t('Failed_To_Load_Import_Data'));
					importHistoryRoute.push();
					return;
				}

				setMessageCount(data.message_count);
				setUsers(data.users.map((user) => ({ ...user, do_import: true })));
				setChannels(data.channels.map((channel) => ({ ...channel, do_import: true })));
				setPreparing(false);
				setProgressRate(null);
			} catch (error) {
				handleError(error, t('Failed_To_Load_Import_Data'));
				importHistoryRoute.push();
			}
		};

		const loadCurrentOperation = async () => {
			try {
				const { operation } = await waitFor(
					getCurrentImportOperation,
					({ operation }) => operation.valid && !ImportWaitingStates.includes(operation.status),
				);

				if (!operation.valid) {
					newImportRoute.push();
					return;
				}

				if (ImportingStartedStates.includes(operation.status)) {
					importProgressRoute.push();
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
					importHistoryRoute.push();
					return;
				}

				if (operation.status === ProgressStep.DONE) {
					importHistoryRoute.push();
					return;
				}

				handleError(t('Unknown_Import_State'));
				importHistoryRoute.push();
			} catch (error) {
				handleError(t('Failed_To_Load_Import_Data'));
				importHistoryRoute.push();
			}
		};

		loadCurrentOperation();
	}, [
		getCurrentImportOperation,
		getImportFileData,
		handleError,
		importHistoryRoute,
		importProgressRoute,
		newImportRoute,
		setMessageCount,
		setPreparing,
		setProgressRate,
		setStatus,
		t,
	]);

	const handleBackToImportsButtonClick = () => {
		importHistoryRoute.push();
	};

	const handleStartButtonClick = async () => {
		setImporting(true);

		try {
			await startImport({ input: { users, channels } });
			importProgressRoute.push();
		} catch (error) {
			handleError(error, t('Failed_To_Start_Import'));
			importHistoryRoute.push();
		}
	};

	const [tab, setTab] = useState('users');
	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const statusDebounced = useDebouncedValue(status, 100);

	return (
		<Page>
			<Page.Header title={t('Importing_Data')}>
				<ButtonGroup>
					<Button ghost onClick={handleBackToImportsButtonClick}>
						<Icon name='back' /> {t('Back_to_imports')}
					</Button>
					<Button primary disabled={isImporting} onClick={handleStartButtonClick}>
						{t('Importer_Prepare_Start_Import')}
					</Button>
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box marginInline='auto' marginBlock='x24' width='full' maxWidth='590px'>
					<Box is='h2' fontScale='p2'>
						{statusDebounced && t(statusDebounced.replace('importer_', 'importer_status_'))}
					</Box>
					{!isPreparing && (
						<Tabs flexShrink={0}>
							<Tabs.Item
								disabled={usersCount === 0}
								selected={tab === 'users'}
								onClick={handleTabClick('users')}
							>
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
									<Box display='flex' justifyContent='center' fontScale='p1'>
										<Box
											is='progress'
											value={(progressRate * 10).toFixed(0)}
											max='1000'
											marginInlineEnd='x24'
										/>
										<Box is='span'>{s.numberFormat(progressRate, 0)}%</Box>
									</Box>
								) : (
									<Throbber justifyContent='center' />
								)}
							</>
						)}
						{!isPreparing && tab === 'users' && (
							<PrepareUsers usersCount={usersCount} users={users} setUsers={setUsers} />
						)}
						{!isPreparing && tab === 'channels' && (
							<PrepareChannels
								channels={channels}
								channelsCount={channelsCount}
								setChannels={setChannels}
							/>
						)}
					</Margins>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default PrepareImportPage;
