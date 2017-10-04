function TokenpassVerifyAddress(command, params, item) {
	if (command !== 'tokenpass-verify-address' || !Match.test(params, String)) {
		return;
	}

	params = s.clean(params);
	const address = s.strLeft(params, ' ');
	const signature = s.strRight(params, `${ address } `);

	if (address !== '' && signature !== '') {
		const user = Meteor.users.findOne(Meteor.userId());
		const channel = RocketChat.models.Rooms.findOneById(item.rid);

		const messages = [];

		RocketChat.verifyTokenpassAddress(user.services.tokenpass.accessToken, address, signature, (error, result) => {
			if (error) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Error', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) } ${ error }`
				);
			} else if (result === true) {
				messages.push(
					TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Result_Success', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language)
				);
			} else {
				messages.push(
					TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Result_Failure', {
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
}

RocketChat.slashCommands.add('tokenpass-verify-address', TokenpassVerifyAddress);
