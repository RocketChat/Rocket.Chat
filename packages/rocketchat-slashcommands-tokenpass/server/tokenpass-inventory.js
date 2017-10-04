function Inventory(command, params, item) {
	if (command !== 'inventory' && command !== 'tokens') {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);
	const balances = RocketChat.updateUserTokenpassBalances(user);

	const messages = [
		TAPi18n.__('Tokenpass_Command_Inventory_Result', {
			postProcess: 'sprintf',
			sprintf: [channel]
		}, user.language)
	];

	if (balances) {
		balances.forEach((tca) => {
			messages.push(`- _${ tca.name }: *${ tca.balance }*_`);
		});
	} else {
		messages.push(
			TAPi18n.__('Tokenpass_Command_Inventory_Result_Empty', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
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

RocketChat.slashCommands.add('inventory', Inventory);
RocketChat.slashCommands.add('tokens', Inventory);
