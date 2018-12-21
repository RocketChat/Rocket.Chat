import './methods';

if (RocketChat.models && RocketChat.models.Permissions) {
	RocketChat.models.Permissions.createOrUpdate('manage-cloud', ['admin']);
}
