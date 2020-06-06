import { IScreenShareProvider } from './IScreenShareProvider';

export class CobrowseScreenShareProvider implements IScreenShareProvider {
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
