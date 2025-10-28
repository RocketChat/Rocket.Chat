import { mockAppRoot } from '@rocket.chat/mock-providers';

export const createRenteionPolicySettingsMock = ({
	enabled = true,
	filesOnly = false,
	doNotPrunePinned = false,
	appliesToChannels = false,
	TTLChannels = 60000,
	appliesToGroups = false,
	TTLGroups = 60000,
	appliesToDMs = false,
	TTLDMs = 60000,
	precision = '0',
	advancedPrecision = false,
	advancedPrecisionCron = '*/30 * * * *',
} = {}) => {
	return mockAppRoot()
		.withTranslations('en', 'core', {
			RetentionPolicy_RoomWarning_NextRunDate: '{{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_Unpinned_NextRunDate: 'Unpinned {{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_FilesOnly_NextRunDate: 'FilesOnly {{maxAge}} {{nextRunDate}}',
			RetentionPolicy_RoomWarning_UnpinnedFilesOnly_NextRunDate: 'UnpinnedFilesOnly {{maxAge}} {{nextRunDate}}',
		})
		.withSetting('RetentionPolicy_Enabled', enabled)
		.withSetting('RetentionPolicy_FilesOnly', filesOnly)
		.withSetting('RetentionPolicy_DoNotPrunePinned', doNotPrunePinned)
		.withSetting('RetentionPolicy_AppliesToChannels', appliesToChannels)
		.withSetting('RetentionPolicy_TTL_Channels', TTLChannels)
		.withSetting('RetentionPolicy_AppliesToGroups', appliesToGroups)
		.withSetting('RetentionPolicy_TTL_Groups', TTLGroups)
		.withSetting('RetentionPolicy_AppliesToDMs', appliesToDMs)
		.withSetting('RetentionPolicy_TTL_DMs', TTLDMs)
		.withSetting('RetentionPolicy_Precision', precision)
		.withSetting('RetentionPolicy_Advanced_Precision', advancedPrecision)
		.withSetting('RetentionPolicy_Advanced_Precision_Cron', advancedPrecisionCron)
		.build();
};
