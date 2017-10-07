function TokenpassVerifyAddress(command, params, item) {
	if (command !== 'tokenpass-verify-address' || !RocketChat.checkTokenpassOAuthEnabled()) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	function notifyInvalidParameters() {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Error_Params', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
	}

	if (!params || params === '') {
		notifyInvalidParameters();
		return;
	}

	params = s.clean(params);
	const address = s.strLeft(params, ' ');
	const signature = s.strRight(params, `${ address } `);

	if (!address || address === '' || !signature || signature === '') {
		notifyInvalidParameters();
		return;
	}

	RocketChat.verifyTokenpassAddress(user && user.services && user.services.tokenpass && user.services.tokenpass.accessToken, address, signature, (error, result) => {
		const messages = [];

		if (error) {
			messages.push(
				`${ TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Error', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language) } ${ error }`
			);
		} else if (result === true) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);
		} else {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassVerifyAddress_Result_Empty', {
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

RocketChat.slashCommands.add('tokenpass-verify-address', TokenpassVerifyAddress);
