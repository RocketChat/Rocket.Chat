import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { ProductService } from '../services/product/service';

Meteor.methods({
	async getOneProduct(productId) {
		check(productId, String);

		const Products = new ProductService();

		const product = await Products.getProduct(productId);

		return product;
	},
});
