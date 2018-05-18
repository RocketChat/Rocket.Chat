if (RocketChat.models && RocketChat.models.Permissions) {
	RocketChat.models.Permissions.createOrUpdate('view-bot-administration', ['admin']);
	RocketChat.models.Permissions.createOrUpdate('view-full-bot-user-info', ['admin']);
}
