import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { ProductService } from '../services/product/service';

Meteor.methods({
	async updateProduct(productId, params) {
		check(productId, String);
		check(
			params,
			Match.ObjectIncluding({
				title: Match.Optional(String),
				description: Match.Optional(String),
				price: Match.Optional(Number),
				ranking: Match.Optional(Number),
			}),
		);

		const Products = new ProductService();

		const product = await Products.update(productId, params);

		return product;
	},
});
