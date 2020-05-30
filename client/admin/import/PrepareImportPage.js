import {
	Badge,
	Box,
	Button,
	ButtonGroup,
	CheckBox,
	Icon,
	Margins,
	Table,
	Tag,
	Throbber,
	Pagination,
	Tabs,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';

import Page from '../../components/basic/Page';
import { useTranslation } from '../../contexts/TranslationContext';
import {
	ProgressStep,
	ImportWaitingStates,
	ImportFileReadyStates,
	ImportPreparingStartedStates,
	ImportingStartedStates,
	ImportingErrorStates,
} from '../../../app/importer/lib/ImporterProgressStep';
import { useErrorHandler } from './useErrorHandler';
import { useRoute } from '../../contexts/RouterContext';
import { useEndpoint } from '../../contexts/ServerContext';

const waitFor = (fn, predicate) => new Promise((resolve, reject) => {
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

function PrepareUsers({ usersCount, users, setUsers }) {
	const t = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), []);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), []);

	return <>
		<Table>
			<Table.Head>
				<Table.Row>
					<Table.Cell width='x36'>
						<CheckBox
							checked={usersCount > 0}
							indeterminate={usersCount > 0 && usersCount !== users.length}
							onChange={() => {
								setUsers((users) => {
									const hasCheckedDeletedUsers = users.some(({ is_deleted, do_import }) => is_deleted && do_import);
									const isChecking = usersCount === 0;

									if (isChecking) {
										return users.map((user) => ({ ...user, do_import: true }));
									}

									if (hasCheckedDeletedUsers) {
										return users.map((user) => (user.is_deleted ? { ...user, do_import: false } : user));
									}

									return users.map((user) => ({ ...user, do_import: false }));
								});
							}}
						/>
					</Table.Cell>
					<Table.Cell is='th'>{t('Username')}</Table.Cell>
					<Table.Cell is='th'>{t('Email')}</Table.Cell>
					<Table.Cell is='th'></Table.Cell>
				</Table.Row>
			</Table.Head>
			<Table.Body>
				{users.slice(current, current + itemsPerPage).map((user) => <Table.Row key={user.user_id}>
					<Table.Cell width='x36'>
						<CheckBox
							checked={user.do_import}
							onChange={(event) => {
								const { checked } = event.currentTarget;
								setUsers((users) =>
									users.map((_user) => (_user === user ? { ..._user, do_import: checked } : _user)));
							}}
						/>
					</Table.Cell>
					<Table.Cell>{user.username}</Table.Cell>
					<Table.Cell>{user.email}</Table.Cell>
					<Table.Cell align='end'>{user.is_deleted && <Tag variant='danger'>{t('Deleted')}</Tag>}</Table.Cell>
				</Table.Row>)}
			</Table.Body>
		</Table>
		<Pagination
			current={current}
			itemsPerPage={itemsPerPage}
			count={users.length || 0}
			onSetItemsPerPage={setItemsPerPage}
			onSetCurrent={setCurrent}
			itemsPerPageLabel={itemsPerPageLabel}
			showingResultsLabel={showingResultsLabel}
		/>
	</>;
}

function PrepareChannels({ channels, channelsCount, setChannels }) {
	const t = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(25);
	const showingResultsLabel = useCallback(({ count, current, itemsPerPage }) => t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count), []);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), []);

	return channels.length && <><Table>
		<Table.Head>
			<Table.Row>
				<Table.Cell width='x36'>
					<CheckBox
						checked={channelsCount > 0}
						indeterminate={channelsCount > 0 && channelsCount !== channels.length}
						onChange={() => {
							setChannels((channels) => {
								const hasCheckedArchivedChannels = channels.some(({ is_archived, do_import }) => is_archived && do_import);
								const isChecking = channelsCount === 0;

								if (isChecking) {
									return channels.map((channel) => ({ ...channel, do_import: true }));
								}

								if (hasCheckedArchivedChannels) {
									return channels.map((channel) => (channel.is_archived ? { ...channel, do_import: false } : channel));
								}

								return channels.map((channel) => ({ ...channel, do_import: false }));
							});
						}}
					/>
				</Table.Cell>
				<Table.Cell is='th'>{t('Name')}</Table.Cell>
				<Table.Cell is='th' align='end'></Table.Cell>
			</Table.Row>
		</Table.Head>
		<Table.Body>
			{channels.slice(current, current + itemsPerPage).map((channel) => <Table.Row key={channel.channel_id}>
				<Table.Cell width='x36'>
					<CheckBox
						checked={channel.do_import}
						onChange={(event) => {
							const { checked } = event.currentTarget;
							setChannels((channels) =>
								channels.map((_channel) => (_channel === channel ? { ..._channel, do_import: checked } : _channel)));
						}}
					/>
				</Table.Cell>
				<Table.Cell>{channel.name}</Table.Cell>
				<Table.Cell align='end'>{channel.is_archived && <Tag variant='danger'>{t('Importer_Archived')}</Tag>}</Table.Cell>
			</Table.Row>)}
		</Table.Body>
	</Table>
	<Pagination
		current={current}
		itemsPerPage={itemsPerPage}
		itemsPerPageLabel={itemsPerPageLabel}
		showingResultsLabel={showingResultsLabel}
		count={channels.length || 0}
		onSetItemsPerPage={setItemsPerPage}
		onSetCurrent={setCurrent}
	/></>;
}

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
	const channelsCount = useMemo(() => channels.filter(({ do_import }) => do_import).length, [channels]);

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
	}, []);

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
				const { operation } = await waitFor(getCurrentImportOperation, ({ operation }) =>
					operation.valid && !ImportWaitingStates.includes(operation.status));

				if (!operation.valid) {
					newImportRoute.push();
					return;
				}

				if (ImportingStartedStates.includes(operation.status)) {
					importProgressRoute.push();
					return;
				}

				if (operation.status === ProgressStep.USER_SELECTION
					|| ImportPreparingStartedStates.includes(operation.status)
					|| ImportFileReadyStates.includes(operation.status)) {
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
	}, []);

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

	return <Page>
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
				<Box is='h2' fontScale='p2'>{statusDebounced && t(statusDebounced.replace('importer_', 'importer_status_'))}</Box>
				{!isPreparing && <Tabs flexShrink={0} >
					<Tabs.Item disabled={usersCount === 0} selected={tab === 'users'} onClick={handleTabClick('users')}>{t('Users')} <Badge is='span'>{usersCount}</Badge></Tabs.Item>
					<Tabs.Item selected={tab === 'channels'} onClick={handleTabClick('channels')}>{t('Channels')} <Badge is='span'>{channelsCount}</Badge></Tabs.Item>
					<Tabs.Item disabled>{t('Messages')}<Badge is='span'>{messageCount}</Badge></Tabs.Item>
				</Tabs>}
				<Margins block='x24'>
					{isPreparing && <>
						{progressRate
							? <Box display='flex' justifyContent='center' fontScale='p1'>
								<Box is='progress' value={(progressRate * 10).toFixed(0)} max='1000' marginInlineEnd='x24' />
								<Box is='span'>{s.numberFormat(progressRate, 0) }%</Box>
							</Box>
							: <Throbber justifyContent='center' />}
					</>}
					{!isPreparing && tab === 'users' && <PrepareUsers usersCount={usersCount} users={users} setUsers={setUsers}/>}
					{!isPreparing && tab === 'channels' && <PrepareChannels channels={channels} channelsCount={channelsCount} setChannels={setChannels}/>}
				</Margins>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export default PrepareImportPage;
