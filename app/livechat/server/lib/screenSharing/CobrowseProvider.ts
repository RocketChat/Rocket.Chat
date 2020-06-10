import { IScreenSharingProvider } from './IScreenSharingProvider';

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
