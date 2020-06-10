import { ScreenSharingManager } from '../ScreenSharingManager';
import { CobrowseProvider } from './CobrowseProvider';

// name of provider will come from settings
export const ScreensharingManager = new ScreenSharingManager('cobrowse.io');

// register all the proviers
ScreensharingManager.registerProvider('cobrowse.io', new CobrowseProvider());

ScreensharingManager.setProvider();
