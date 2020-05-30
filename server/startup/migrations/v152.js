import { Meteor } from 'meteor/meteor';

import { Migrations } from '../../migrations';
import { Users } from '../../../app/models/server';
import { MAX_RESUME_LOGIN_TOKENS } from '../../lib/accounts';

Migrations.add({
	version: 152,
	async up() {
		await Users.model.rawCollection().aggregate([
			{
				$project: {
					tokens: {
						$filter: {
							input: '$services.resume.loginTokens',
							as: 'token',
							cond: {
								$ne: ['$$token.type', 'personalAccessToken'],
							},
						},
					},
				},
			},
			{ $unwind: '$tokens' },
			{ $group: { _id: '$_id', tokens: { $push: '$tokens' } } },
			{
				$project: {
					sizeOfTokens: { $size: '$tokens' }, tokens: '$tokens' },
			},
			{ $match: { sizeOfTokens: { $gt: MAX_RESUME_LOGIN_TOKENS } } },
			{ $sort: { 'tokens.when': 1 } },
		]).forEach(Meteor.bindEnvironment((user) => {
			const oldestDate = user.tokens.reverse()[MAX_RESUME_LOGIN_TOKENS - 1];
			Users.removeOlderResumeTokensByUserId(user._id, oldestDate.when);
		}));
	},
});
