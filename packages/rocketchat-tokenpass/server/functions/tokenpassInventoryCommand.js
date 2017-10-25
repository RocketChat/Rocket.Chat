function InventoryCommand(command, params, item) {
	if ((command !== 'inventory' && command !== 'tokens') || !RocketChat.checkTokenpassOAuthEnabled()) {
		return;
	}

	const messages = [];
	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	if (user && user.services && user.services.tokenpass && user.services.tokenpass.accessToken) {
		const balances = RocketChat.updateUserTokenpassBalances(user);

		if (balances) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_Inventory_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);

			balances.forEach((tca) => {
				messages.push(`- ${ tca.name }: *${ tca.balance }*`);
			});
		} else {
			messages.push(
				TAPi18n.__('Tokenpass_Command_Inventory_Result_Empty', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);
		}
	} else {
		messages.push(
			TAPi18n.__('Tokenpass_Command_Error_NotLoggedIn', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user && user.language)
		);
	}

	messages.forEach((msg) => {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg
		});
	});
}

RocketChat.slashCommands.add('inventory', InventoryCommand);
RocketChat.slashCommands.add('tokens', InventoryCommand);
