import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { TransactionService } from '../services/transaction/service';

if (Meteor.isServer) {
	const Transactions = new TransactionService();

	Meteor.publish('transactions.getList', function (paginationOptions, queryOptions) {
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

		return Transactions.list(paginationOptions, queryOptions);
	});
}
