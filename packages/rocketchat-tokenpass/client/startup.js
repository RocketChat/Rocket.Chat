Meteor.startup(function() {
	RocketChat.ChannelSettings.addOption({
		group: ['room'],
		id: 'tokenpass',
		template: 'channelSettings__tokenpass',
		validation(data) {
			if (data && data.rid) {
				const room = RocketChat.models.Rooms.findOne(data.rid, { fields: { tokenpass: 1 } });

				return room && room.tokenpass;
			}

			return false;
		}
	});

	Meteor.call('checkTokenpassOAuthEnabled', (error, result) => {
		if (result && result === true) {
			RocketChat.slashCommands.add('tokenpass-add-address', null, {
				description: 'Tokenpass_Command_TokenpassAddAddress_Description',
				params: 'Tokenpass_Command_TokenpassAddAddress_Params'
			});

			RocketChat.slashCommands.add('inventory', null, {
				description: 'Tokenpass_Command_Inventory_Description'
			});

			RocketChat.slashCommands.add('tokens', null, {
				description: 'Tokenpass_Command_Tokens_Description'
			});

			RocketChat.slashCommands.add('lend', null, {
				description: 'Tokenpass_Command_Lend_Description',
				params: 'Tokenpass_Command_Lend_Params'
			});

			RocketChat.slashCommands.add('tokenpass', null, {
				description: 'Tokenpass_Command_Tokenpass_Description'
			});

			RocketChat.slashCommands.add('tokenpass-verify-address', null, {
				description: 'Tokenpass_Command_TokenpassVerifyAddress_Description',
				params: 'Tokenpass_Command_TokenpassVerifyAddress_Params'
			});
		}
	});
});
