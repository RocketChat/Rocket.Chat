import type { ISettingStatistics, ISettingStatisticsObject } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';

const setSettingsStatistics = async (settings: ISettingStatistics): Promise<ISettingStatisticsObject> => {
	const {
		account2fa,
		cannedResponsesEnabled,
		e2e,
		e2eDefaultDirectRoom,
		e2eDefaultPrivateRoom,
		smtpHost,
		smtpPort,
		fromEmail,
		fileUploadEnable,
		frameworkDevMode,
		frameworkEnable,
		surveyEnabled,
		updateChecker,
		liveStream,
		broadcasting,
		allowEditing,
		allowDeleting,
		allowUnrecognizedSlashCommand,
		allowBadWordsFilter,
		readReceiptEnabled,
		readReceiptStoreUsers,
		globalSearchEnabled,
		otrEnable,
		pushEnable,
		threadsEnabled,
		webRTCEnableChannel,
		webRTCEnablePrivate,
		webRTCEnableDirect,
	} = settings;

	// If Canned Response does not exist add blank object to the statistic
	const cannedRes = cannedResponsesEnabled !== undefined ? { cannedResponses: { cannedResponsesEnabled } } : {};

	const statisticObject = {
		accounts: {
			account2fa,
		},
		...cannedRes,
		e2ee: {
			e2e,
			e2eDefaultDirectRoom,
			e2eDefaultPrivateRoom,
		},
		email: {
			smtp: {
				smtpHost,
				smtpPort,
				fromEmail,
			},
		},
		fileUpload: {
			fileUploadEnable,
		},
		general: {
			apps: {
				frameworkDevMode,
				frameworkEnable,
			},
			nps: {
				surveyEnabled,
			},
			update: {
				updateChecker,
			},
		},
		liveStreamAndBroadcasting: {
			liveStream,
			broadcasting,
		},
		message: {
			allowEditing,
			allowDeleting,
			allowUnrecognizedSlashCommand,
			allowBadWordsFilter,
			readReceiptEnabled,
			readReceiptStoreUsers,
		},
		otr: {
			otrEnable,
		},
		push: {
			pushEnable,
		},
		search: {
			defaultProvider: {
				globalSearchEnabled,
			},
		},
		threads: {
			threadsEnabled,
		},
		webRTC: {
			webRTCEnableChannel,
			webRTCEnablePrivate,
			webRTCEnableDirect,
		},
	};
	return statisticObject;
};
export const getSettingsStatistics = async (): Promise<ISettingStatisticsObject> => {
	try {
		const settingsBase = [
			{ key: 'Accounts_TwoFactorAuthentication_Enabled', alias: 'account2fa' },
			{ key: 'E2E_Enable', alias: 'e2e' },
			{ key: 'E2E_Enabled_Default_DirectRooms', alias: 'e2eDefaultDirectRoom' },
			{ key: 'E2E_Enabled_Default_PrivateRooms', alias: 'e2eDefaultPrivateRoom' },
			{ key: 'SMTP_Host', alias: 'smtpHost' },
			{ key: 'SMTP_Port', alias: 'smtpPort' },
			{ key: 'From_Email', alias: 'fromEmail' },
			{ key: 'FileUpload_Enabled', alias: 'fileUploadEnable' },
			{ key: 'NPS_survey_enabled', alias: 'surveyEnabled' },
			{ key: 'Update_EnableChecker', alias: 'updateChecker' },
			{ key: 'Livestream_enabled', alias: 'liveStream' },
			{ key: 'Broadcasting_enabled', alias: 'broadcasting' },
			{ key: 'Message_AllowEditing', alias: 'allowEditing' },
			{ key: 'Message_AllowDeleting', alias: 'allowDeleting' },
			{ key: 'Message_AllowUnrecognizedSlashCommand', alias: 'allowUnrecognizedSlashCommand' },
			{ key: 'Message_AllowBadWordsFilter', alias: 'allowBadWordsFilter' },
			{ key: 'Message_Read_Receipt_Enabled', alias: 'readReceiptEnabled' },
			{ key: 'Message_Read_Receipt_Store_Users', alias: 'readReceiptStoreUsers' },
			{ key: 'Search.defaultProvider.GlobalSearchEnabled', alias: 'globalSearchEnabled' },
			{ key: 'OTR_Enable', alias: 'otrEnable' },
			{ key: 'Push_enable', alias: 'pushEnable' },
			{ key: 'Threads_enabled', alias: 'threadsEnabled' },
			{ key: 'WebRTC_Enable_Channel', alias: 'webRTCEnableChannel' },
			{ key: 'WebRTC_Enable_Private', alias: 'webRTCEnablePrivate' },
			{ key: 'WebRTC_Enable_Direct', alias: 'webRTCEnableDirect' },
			{ key: 'Canned_Responses_Enable', alias: 'cannedResponsesEnabled' },
		] as const;

		const settingsStatistics = settingsBase.reduce<ISettingStatistics>((acc, { key, alias }) => {
			if (!settings.has(key)) return acc;

			acc[alias] = settings.get(key);

			return acc;
		}, {});

		const staticticObject = await setSettingsStatistics(settingsStatistics);

		return staticticObject;
	} catch (error: any) {
		return error;
	}
};
