if (RocketChat.models && RocketChat.models.Permissions) {
	RocketChat.models.Permissions.createOrUpdate('view-bot-administration', ['admin']);
	RocketChat.models.Permissions.createOrUpdate('create-bot-account', ['admin']);
	RocketChat.models.Permissions.createOrUpdate('edit-bot-account', ['admin']);
	RocketChat.models.Permissions.createOrUpdate('manage-bot-account', ['admin']);
	RocketChat.models.Permissions.createOrUpdate('delete-bot-account', ['admin']);
}
