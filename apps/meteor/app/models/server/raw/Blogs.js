import { BaseRaw } from './BaseRaw';

export class BlogsRaw extends BaseRaw {
    constructor(...args) {
		super(...args);

		this.defaultFields = {
			tags: [],
		};
	}
};