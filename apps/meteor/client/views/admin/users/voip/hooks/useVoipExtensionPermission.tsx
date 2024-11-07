import { useSetting, usePermission } from '@rocket.chat/ui-contexts';

export const useVoipExtensionPermission = () => {
	const isVoipSettingEnabled = useSetting('VoIP_TeamCollab_Enabled', false);
	const canManageVoipExtensions = usePermission('manage-voip-extensions');

	return isVoipSettingEnabled && canManageVoipExtensions;
};
