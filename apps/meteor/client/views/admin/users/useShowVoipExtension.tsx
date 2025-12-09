import { useSetting } from '@rocket.chat/ui-contexts';

export const useShowVoipExtension = () => {
	const isVoipSettingEnabled = useSetting('VoIP_TeamCollab_Enabled', false);

	return isVoipSettingEnabled;
};
