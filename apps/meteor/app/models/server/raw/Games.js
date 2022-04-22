import { BaseRaw } from './BaseRaw';

export class GamesRaw extends BaseRaw {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			tags: [],
			ranking: 0,
		};
	}
}
