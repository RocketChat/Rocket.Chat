import { Mongo } from 'meteor/mongo';

type UFSTokensModel = {
	fileId: string;
	createdAt: Date;
	value: string;
};

export const Tokens = new Mongo.Collection<UFSTokensModel>('ufsTokens');
