// /tokenpass-add-address [address] allows a user to add a new token pocket. This is a multi-step process,
// once the initial command and address are sent, the API will return and the chat should privately show a verification
// phrase which needs to be signed, or a unique cryptocurrency address which can have any amount sent to it by the
// new pocket. If using pay-to-verify, once payment is detected the chat can print another message indicating the
// process is complete. If signing, proceed to 4

function TokenpassAddAddress(command, params, item) {
	console.log(params);

	if (command !== 'tokenpass-add-address' || !Match.test(params, String)) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	const messages = [
		`*${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Result', {
			postProcess: 'sprintf',
			sprintf: [channel]
		}, user.language) }*`
	];

	RocketChat.registerTokenpassAddress(user.services.tokenpass.accessToken, params, (error, result) => {
		if (error) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Result_Error', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);
		} else if (result) {
			messages.push(result);
		} else {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Result_Empty', {
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
	});
}

RocketChat.slashCommands.add('tokenpass-add-address', TokenpassAddAddress);
