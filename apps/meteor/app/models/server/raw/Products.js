import { BaseRaw } from './BaseRaw';

export class ProductsRaw extends BaseRaw {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			ranking: 0,
		};
	}
}
