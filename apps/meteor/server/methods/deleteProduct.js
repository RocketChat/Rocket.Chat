import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { ProductService } from '../services/product/service';

Meteor.methods({
	async deleteProduct(productId) {
		check(productId, String);

		const Products = new ProductService();

		await Products.delete(productId);

		return true;
	},
});
