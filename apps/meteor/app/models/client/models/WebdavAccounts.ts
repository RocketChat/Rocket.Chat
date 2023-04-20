import { Mongo } from 'meteor/mongo';

/** @deprecated */
export const WebdavAccounts = new Mongo.Collection<{
	_id: string;
	name: string;
	username: string;
	serverURL: string;
}>(null);
