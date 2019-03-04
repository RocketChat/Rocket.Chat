import { Permissions } from 'meteor/rocketchat:models';

if (Permissions) {
	Permissions.createOrUpdate('view-bot-administration', ['admin']);
	Permissions.createOrUpdate('create-bot-account', ['admin']);
	Permissions.createOrUpdate('edit-bot-account', ['admin']);
	Permissions.createOrUpdate('manage-bot-account', ['admin']);
	Permissions.createOrUpdate('delete-bot-account', ['admin']);
}
