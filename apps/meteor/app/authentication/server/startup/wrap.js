import { Accounts } from 'meteor/accounts-base';

const wrap = (context, original) =>
	function (fn) {
		original.call(context, (...args) => {
			const result = Promise.await(fn.apply(context, args));
			return result;
		});
	};
Accounts.onCreateUser = wrap(Accounts, Accounts.onCreateUser);
Accounts.validateLoginAttempt = wrap(Accounts, Accounts.validateLoginAttempt);
Accounts.validateNewUser = wrap(Accounts, Accounts.validateNewUser);
