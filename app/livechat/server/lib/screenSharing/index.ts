import { ScreenSharingManager } from '../ScreenSharingManager';
import { CobrowseProvider } from './CobrowseProvider';
import { settings } from '../../../../settings/server';

// name of provider will come from settings
export const ScreensharingManager = new ScreenSharingManager();

settings.get('Livechat_screen_sharing_provider', function(key, value) {
	ScreensharingManager.setProviderName(value);
});

// register all the proviers
ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());

ScreensharingManager.setProvider();
