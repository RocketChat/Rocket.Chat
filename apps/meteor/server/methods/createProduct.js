import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { ProductService } from '../services/product/service';

Meteor.methods({
	async createProduct(params) {
		check(
			params,
			Match.ObjectIncluding({
				title: String,
				description: String,
				ranking: Match.Optional(Number),
				price: Number,
			}),
		);

		const Products = new ProductService();

		const product = await Products.create(params);

		return product;
	},
});
