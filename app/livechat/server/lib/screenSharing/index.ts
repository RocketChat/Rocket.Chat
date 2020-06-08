// import { IScreenShareProvider } from './IScreenShareProvider';
import { ScreenSharingManager } from '../ScreenSharingManager';
import { CobrowseScreenShareProvider } from './CobrowseScreenShareProvider';


// name of provider will come from settings
export const ScreensharingManager = new ScreenSharingManager('cobrowse.io');

// register all the proviers
ScreensharingManager.registerProvider('cobrowse.io', new CobrowseScreenShareProvider());

ScreensharingManager.setProvider();
