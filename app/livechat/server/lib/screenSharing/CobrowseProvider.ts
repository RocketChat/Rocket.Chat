import { IScreenSharingProvider } from './IScreenSharingProvider';
import { ScreensharingManager } from '../ScreenSharingManager';

export class CobrowseProvider implements IScreenSharingProvider {
	config = {
		name: 'cobrowse.io',
	}

	constructor() {
		this.config.name = 'cobrowse.io';
	}

	getInfo(): any {
		return 'info from cobrowse.io';
	}
}

ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
