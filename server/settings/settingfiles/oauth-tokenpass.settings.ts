import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import { updateUserTokenpassBalances } from '../../integrations/oauth/tokenpass/functions/updateUserTokenpassBalances';
import { settings } from '..';
import { callbacks } from '../../utils/hooks';
import { validateTokenAccess } from '../../integrations/oauth/tokenpass/roomAccessValidator.compatibility';
import '../../integrations/oauth/tokenpass/roomAccessValidator.internalService';

settings.addGroup('OAuth', function() {
	this.section('Tokenpass', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenpass',
			value: true,
		};

		this.add('Accounts_OAuth_Tokenpass', false, { type: 'boolean' });
		this.add('API_Tokenpass_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_Tokenpass_URL_Description' });
		this.add('Accounts_OAuth_Tokenpass_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});

Meteor.startup(function() {
	callbacks.add('beforeJoinRoom', function(user: any, room: any): any {
		if (room.tokenpass && !validateTokenAccess(user, room)) {
			throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
		}

		return user;
	});
});

Accounts.onLogin(function({ user }: { [k: string]: any }) {
	if (user && user.services && user.services.tokenpass) {
		updateUserTokenpassBalances(user);
	}
});
