import { Mongo } from 'meteor/mongo';

export const CannedResponse = new Mongo.Collection<{
	_id: string;
	shortcut: string;
	text: string;
}>(null);
