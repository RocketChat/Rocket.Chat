// /tokenpass-add-address [address] allows a user to add a new token pocket

function TokenpassAddAddress(command, params, item) {
	if (command !== 'tokenpass-add-address' || !Match.test(params, String)) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	const messages = [];

	RocketChat.registerTokenpassAddress(user.services.tokenpass.accessToken, params, (error, result) => {
		if (error) {
			messages.push(
				`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Error', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language) } ${ error }`
			);
		} else if (result) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);
			messages.push(
				`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Name', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language) }: ${ result.address }`
			);
			if (result.label) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Label', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: ${ result.label }`
				);
			}
			if (result.type) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Type', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: ${ result.type }`
				);
			}
			if (result.verify_code) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_VerifyCode', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: ${ result.verify_code }`
				);
			}
			if (result.verify_address) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_VerifyAddress', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: ${ result.verify_address }`
				);
			}
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
