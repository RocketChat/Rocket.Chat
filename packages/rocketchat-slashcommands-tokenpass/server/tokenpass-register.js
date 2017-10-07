function TokenpassRegister(command, params, item) {
	if (command !== 'tokenpass' || !RocketChat.checkTokenpassOAuthEnabled()) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	const messages = [];

	if (user && user.services && user.services.tokenpass) {
		const tokenpassUserAccountResume = RocketChat.getTokenpassUserAccountResume(user);
		messages.push(
			TAPi18n.__('Tokenpass_Command_Tokenpass_Account_Result', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		);
		messages.push(
			`- ${ TAPi18n.__('Tokenpass_Command_Tokenpass_Account_Username', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language) }: *${ tokenpassUserAccountResume.username }*`
		);
		messages.push(
			`- ${ TAPi18n.__('Tokenpass_Command_Tokenpass_Account_NumberOfTokens', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language) }: *${ tokenpassUserAccountResume.numberOfTokens }*`
		);
	} else {
		RocketChat.registerTokenpassUserAccount(user, (error, result) => {
			if (error) {
				messages.push(
					`${ TAPi18n.__('Tokenpass_Command_Tokenpass_Error', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) } ${ error }`
				);
			} else if (result) {
				messages.push(
					TAPi18n.__('Tokenpass_Command_Tokenpass_Result', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language)
				);
				messages.push(
					TAPi18n.__('Tokenpass_Command_Tokenpass_Account_Result', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language)
				);
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_Tokenpass_Account_Username', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.username }*`
				);
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_Tokenpass_Account_Email', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.email }*`
				);
			} else {
				messages.push(
					TAPi18n.__('Tokenpass_Command_Tokenpass_Result_Empty', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language)
				);
			}
		});
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

RocketChat.slashCommands.add('tokenpass', TokenpassRegister);
