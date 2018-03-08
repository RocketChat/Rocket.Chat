RocketChat.Migrations.add({
	version: 108,
	up() {
		RocketChat.models.Subscriptions.tryDropIndex('u._id_1_name_1_t_1_code_1');
		console.log('Fixing ChatSubscription u._id_1_name_1_t_1_code_1');
	}
});
