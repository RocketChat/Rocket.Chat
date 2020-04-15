import { Throbber } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useEffect, useState } from 'react';

import { Page } from '../../../../client/components/basic/Page';
import { APIClient } from '../../../utils/client';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { ProgressStep, ImportWaitingStates, ImportFileReadyStates, ImportPreparingStartedStates, ImportingStartedStates, ImportingErrorStates } from '../../lib/ImporterProgressStep';
import { ImporterWebsocketReceiver } from '../ImporterWebsocketReceiver';
import { showImporterException } from '../functions/showImporterException';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';

function PrepareImportRoute() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [preparing, setPreparing] = useState(true);
	const [progressRate, setProgressRate] = useState(false);
	const [users, setUsers] = useState([]);
	const [channels, setChannels] = useState([]);
	const [messageCount, setMessageCount] = useState(0);

	useEffect(() => {
		const progressUpdated = (progress) => {
			if ('rate' in progress) {
				const { rate } = progress;
				setProgressRate(rate);
			}
		};

		const getImportFileData = () => {
			APIClient.get('v1/getImportFileData').then((data) => {
				if (!data) {
					console.warn('The importer is not set up correctly, as it did not return any data.');
					dispatchToastMessage({ type: 'error', message: t('Importer_not_setup') });
					return FlowRouter.go('/admin/import');
				}

				if (data.waiting) {
					setTimeout(() => {
						getImportFileData();
					}, 1000);
					return;
				}

				if (data.step) {
					console.warn('Invalid file, contains `data.step`.', data);
					dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Data') });
					return FlowRouter.go('admin-import');
				}

				setUsers(data.users);
				setChannels(data.channels);
				setMessageCount(data.message_count);
				setPreparing(false);
				setProgressRate(false);
			}).catch((error) => {
				if (error) {
					showImporterException(error, 'Failed_To_Load_Import_Data');
					return FlowRouter.go('admin-import');
				}
			});
		};

		let callbackRegistered = false;

		const loadOperation = () => {
			APIClient.get('v1/getCurrentImportOperation').then((data) => {
				const { operation } = data;

				if (!operation.valid) {
					return FlowRouter.go('admin-import-new');
				}

				// If the import has already started, move to the progress screen
				if (ImportingStartedStates.includes(operation.status)) {
					return FlowRouter.go('admin-import-progress');
				}

				// The getImportFileData method can handle it if the state is:
				// 1) ready to select the users,
				// 2) preparing
				// 3) ready to be prepared

				if (operation.status === ProgressStep.USER_SELECTION || ImportPreparingStartedStates.includes(operation.status) || ImportFileReadyStates.includes(operation.status)) {
					if (!callbackRegistered) {
						ImporterWebsocketReceiver.registerCallback(progressUpdated);
						callbackRegistered = true;
					}

					getImportFileData();
					return setPreparing(true);
				}

				// We're still waiting for a file... This shouldn't take long
				if (ImportWaitingStates.includes(operation.status)) {
					setTimeout(() => {
						loadOperation();
					}, 1000);

					return setPreparing(true);
				}

				if (ImportingErrorStates.includes(operation.status)) {
					dispatchToastMessage({ type: 'error', message: t('Import_Operation_Failed') });
					return FlowRouter.go('admin-import');
				}

				if (operation.status === ProgressStep.DONE) {
					return FlowRouter.go('admin-import');
				}

				dispatchToastMessage({ type: 'error', message: t('Unknown_Import_State') });
				return FlowRouter.go('/admin/import');
			}).catch((error) => {
				if (error) {
					dispatchToastMessage({ type: 'error', message: t('Failed_To_Load_Import_Data') });
					return FlowRouter.go('admin-import');
				}
			});
		};

		loadOperation();

		return () => {
			ImporterWebsocketReceiver.unregisterCallback(progressUpdated);
		};
	}, []);

	const pathFor = (path, { hash } = {}) => FlowRouter.path(path, hash);

	const canRunImport = usePermission('run-import');

	const [startDisabled, setStartDisabled] = useState(false);
	const [checkedUsers, setCheckedUsers] = useState({});
	const [checkedChannels, setCheckedChannels] = useState({});

	const handleUserCheckBoxChange = (user) => (event) => {
		const { checked } = event.currentTarget;
		setCheckedUsers((checkedUsers) => ({ ...checkedUsers, [user.user_id]: checked }));
	};

	const handleChannelCheckBoxChange = (channel) => (event) => {
		const { checked } = event.currentTarget;
		setCheckedChannels((checkedChannels) => ({ ...checkedChannels, [channel.channel_id]: checked }));
	};

	const handleStartButtonClick = () => {
		setStartDisabled(true);
		for (const user of Array.from(users)) {
			user.do_import = checkedUsers[user.user_id];
		}

		for (const channel of Array.from(channels)) {
			channel.do_import = checkedChannels[channel.channel_id];
		}

		APIClient.post('v1/startImport', { input: { users, channels } }).then(() => {
			setUsers([]);
			setChannels([]);
			return FlowRouter.go('admin-import-progress');
		}).catch((error) => {
			if (error) {
				showImporterException(error, 'Failed_To_Start_Import');
				return FlowRouter.go('admin-import');
			}
		});
	};

	const handleUncheckDeletedUsersClick = () => {
		setCheckedUsers((checkedUsers) => {
			Array.from(users).filter((user) => user.is_deleted).forEach((user) => {
				checkedUsers = { ...checkedUsers, [user.user_id]: false };
			});

			return checkedUsers;
		});
	};

	const handleCheckAllUsersClick = () => {
		setCheckedUsers((checkedUsers) => {
			Array.from(users).forEach((user) => {
				checkedUsers = { ...checkedUsers, [user.user_id]: true };
			});

			return checkedUsers;
		});
	};

	const handleUncheckAllUsersClick = () => {
		setCheckedUsers((checkedUsers) => {
			Array.from(users).forEach((user) => {
				checkedUsers = { ...checkedUsers, [user.user_id]: false };
			});

			return checkedUsers;
		});
	};

	const handleUncheckArchivedChannelsClick = () => {
		setCheckedChannels((checkedChannels) => {
			Array.from(channels).filter((channel) => channel.is_archived).forEach((channel) => {
				checkedChannels = { ...checkedChannels, [channel.channel_id]: false };
			});

			return checkedChannels;
		});
	};

	const handleCheckAllChannelsClick = () => {
		setCheckedChannels((checkedChannels) => {
			Array.from(channels).forEach((channel) => {
				checkedChannels = { ...checkedChannels, [channel.channel_id]: true };
			});

			return checkedChannels;
		});
	};

	const handleUncheckAllChannelsClick = () => {
		setCheckedChannels((checkedChannels) => {
			Array.from(channels).forEach((channel) => {
				checkedChannels = { ...checkedChannels, [channel.channel_id]: false };
			});

			return checkedChannels;
		});
	};

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <Page className='page-settings'>
		<Page.Header title={t('Importing_Data')} />

		<Page.ContentShadowScroll>
			{preparing ? <>
				{progressRate ? `${ progressRate }%` : ''}

				<Throbber justifyContent='center' />
			</> : <>
				<a href={pathFor('admin-import')}><i className='icon-angle-left' /> {t('Back_to_imports')}</a><br/><br/>

				<div className='section'>
					<h1>{t('Actions')}</h1>
					<div className='section-content'>
						<button className='button primary start' disabled={startDisabled} onClick={handleStartButtonClick}><i className='icon-send' /><span>{t('Importer_Prepare_Start_Import')}</span></button>
					</div>
				</div>

				<div className='section'>
					<h1>{t('Messages')}: {messageCount}</h1>
				</div>

				{users.length
						&& <div className='section'>
							<h1>{t('Users')}</h1>
							<div className='section-content'>
								<div className='section-content'>
									<button className='button check-all-users' onClick={handleCheckAllUsersClick}><i className='icon-send' /><span>{t('Check_All')}</span></button>
									<button className='button uncheck-all-users' onClick={handleUncheckAllUsersClick}><i className='icon-send' /><span>{t('Uncheck_All')}</span></button>
									<button className='button uncheck-deleted-users' onClick={handleUncheckDeletedUsersClick}><i className='icon-send' /><span>{t('Importer_Prepare_Uncheck_Deleted_Users')}</span></button>
								</div>

								<ul>
									{users.filter(({ is_bot }) => !is_bot).map((user) =>
										<li key={user.user_id}>
											<input type='checkbox' name={user.user_id} id={`user_${ user.user_id }`} checked={!!checkedUsers[user.user_id]} onChange={handleUserCheckBoxChange(user)} />
											<label htmlFor={`user_${ user.user_id }`}>{user.username} - {user.email}</label>
											{user.is_deleted && <em>({t('Deleted')})</em>}
											{user.is_email_taken && <em>({t('Duplicated_Email_address_will_be_ignored')})</em>}
										</li>,
									)}
								</ul>
							</div>
						</div>
				}

				{channels.length
						&& <div className='section'>
							<h1>{t('Channels')}</h1>
							<div className='section-content'>
								<div className='section-content'>
									<button className='button check-all-channels' onClick={handleCheckAllChannelsClick}><i className='icon-send' /><span>{t('Check_All')}</span></button>
									<button className='button uncheck-all-channels' onClick={handleUncheckAllChannelsClick}><i className='icon-send' /><span>{t('Uncheck_All')}</span></button>
									<button className='button uncheck-archived-channels' onClick={handleUncheckArchivedChannelsClick}><i className='icon-send' /><span>{t('Importer_Prepare_Uncheck_Archived_Channels')}</span></button>
								</div>

								<ul>
									{channels.map((channel) =>
										<li key={channel.channel_id}>
											<input type='checkbox' name={channel.channel_id} id={`channel_${ channel.channel_id }`} checked={!!checkedChannels[channel.channel_id]} onChange={handleChannelCheckBoxChange(channel)} />
											<label htmlFor={`channel_${ channel.channel_id }`}>{channel.name}</label>
											{channel.is_archived && <em>({t('Importer_Archived')})</em>}
											{channel.is_private && <em>({t('Private_Group')})</em>}
										</li>,
									)}
								</ul>
							</div>
						</div>
				}
			</>}
		</Page.ContentShadowScroll>
	</Page>;
}

export default PrepareImportRoute;
