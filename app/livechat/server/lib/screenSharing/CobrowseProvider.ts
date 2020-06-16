import { IScreenSharingProvider } from './IScreenSharingProvider';
import { ScreensharingManager } from '../ScreenSharingManager';

export class CobrowseProvider implements IScreenSharingProvider {
	config = {
		name: 'Cobrowse.io',
		providerBundle: 'https://ashwaniYDV.github.io/sstest/ssbundle.js',
	}

	getInfo(): any {
		return 'info from cobrowse.io';
	}
}

ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
