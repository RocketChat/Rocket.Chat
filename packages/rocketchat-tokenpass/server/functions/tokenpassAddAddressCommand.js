import s from 'underscore.string';

function TokenpassAddAddressCommand(command, params, item) {
	if (command !== 'tokenpass-add-address' || !RocketChat.checkTokenpassOAuthEnabled()) {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const channel = RocketChat.models.Rooms.findOneById(item.rid);

	if (!params || s.clean(params) === '') {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Error_Params', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language)
		});
		return;
	}

	try {
		const result = RocketChat.registerTokenpassAddress(user && user.services && user.services.tokenpass && user.services.tokenpass.accessToken, params);

		const messages = [];

		if (result && result !== {}) {
			messages.push(
				TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Result', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language)
			);

			messages.push(
				`- ${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Name', {
					postProcess: 'sprintf',
					sprintf: [channel]
				}, user.language) }: *${ result.address }*`
			);

			if (result.label) {
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Label', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.label }*`
				);
			}

			if (result.type) {
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Type', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.type }*`
				);
			}

			if (result.verify_code) {
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_VerifyCode', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.verify_code }*`
				);
			}

			if (result.verify_address) {
				messages.push(
					`- ${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_VerifyAddress', {
						postProcess: 'sprintf',
						sprintf: [channel]
					}, user.language) }: *${ result.verify_address }*`
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
	} catch (exception) {
		RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: `${ TAPi18n.__('Tokenpass_Command_TokenpassAddAddress_Error', {
				postProcess: 'sprintf',
				sprintf: [channel]
			}, user.language) } ${ exception.error }`
		});
	}
}

RocketChat.slashCommands.add('tokenpass-add-address', TokenpassAddAddressCommand);
