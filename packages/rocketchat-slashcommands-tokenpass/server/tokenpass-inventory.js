function Inventory(command, params, item) {
	console.log(`*${ command }*`);

	if (command !== 'inventory' && command !== 'tokens') {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	RocketChat.updateUserTokenpassBalances(user, (error, balances) => {
		if (balances) {
			console.log('TCA Balances', balances);

			const messages = [
				TAPi18n.__('Tokenpass_Command_Inventory_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			];

			balances.forEach((tca) => {
				messages.push(`\`${ tca.name }: ${ tca.balance }\``);
			});

			messages.forEach((msg) => {
				RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
					_id: Random.id(),
					rid: item.rid,
					ts: new Date(),
					msg
				});
			});
		}
	});
}

RocketChat.slashCommands.add('inventory', Inventory);
RocketChat.slashCommands.add('tokens', Inventory);
