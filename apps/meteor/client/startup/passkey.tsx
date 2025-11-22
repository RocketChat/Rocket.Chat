import { Accounts } from 'meteor/accounts-base';

Accounts.onLogin(async (user) => {
	// TODO fzh075 temporary solution
	setTimeout(() => {
		window.dispatchEvent(new CustomEvent('user-logged-in', { detail: { userId: user.id } }));
	}, 1000);
});
