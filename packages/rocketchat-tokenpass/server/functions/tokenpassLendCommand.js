import s from 'underscore.string';

function LendCommand(command, params, item) {
	if (command !== 'lend' || !RocketChat.checkTokenpassOAuthEnabled()) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);
	const paramsList = s.words(params || '');
	const messages = [];

	try {
		check(paramsList[0], String);
		check(paramsList[1], String);
		check(paramsList[2], String);
		check(paramsList[3], String);
		check(paramsList[4], Match.Maybe(String));
	} catch (exception) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Tokenpass_Command_Lend_Error_Params', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
		return;
	}

	try {
		const result = RocketChat.lendTokenpassToken({
			address: paramsList[0],
			token: paramsList[1],
			amount: parseFloat(paramsList[2]),
			username: `user:${ paramsList[3] }`,
			days: (paramsList[4] && paramsList[4] !== '') ? parseInt(paramsList[4]) : 0
		});

		if (result) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_Lend_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);
		} else {
			messages.push(
				TAPi18n.__('Tokenpass_Command_Lend_Result_Empty', {
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
	} catch (exception) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: `${ TAPi18n.__('Tokenpass_Command_Lend_Error', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language) } ${ exception.error }`
		});
	}
}

RocketChat.slashCommands.add('lend', LendCommand);
