import { Mongo } from 'meteor/mongo';

export const CannedResponses = new Mongo.Collection<{
	_id: string;
	shortcut: string;
	text: string;
}>(null);
