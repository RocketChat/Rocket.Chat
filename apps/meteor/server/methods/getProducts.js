import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { ProductService } from '../services/product/service';

Meteor.methods({
	async getProducts(paginationOptions, queryOptions) {
		check(
			paginationOptions,
			Match.ObjectIncluding({
				offset: Match.Optional(Number),
				count: Match.Optional(Number),
			}),
		);
		check(
			queryOptions,
			Match.ObjectIncluding({
				sort: Match.Optional(Object),
				query: Match.Optional(Object),
			}),
		);

		const Products = new ProductService();

		const results = await Products.list(paginationOptions, queryOptions);

		return results;
	},
});
