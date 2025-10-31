import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod, type LoginCallback } from '../../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPassword(
			userDescriptor: { username: string } | { email: string } | { id: string } | string,
			password: string,
			callback?: LoginCallback,
		): void;
	}
}

export const loginWithPasswordAndTOTP = (
  userDescriptor: { username: string } | { email: string } | { id: string } | string,
  password: string,
  code: string,
  callback?: LoginCallback,
): Promise<void> => {
  if (typeof userDescriptor === 'string') {
    if (userDescriptor.indexOf('@') === -1) {
      userDescriptor = { username: userDescriptor };
    } else {
      userDescriptor = { email: userDescriptor };
    }
  }

  return new Promise<void>((resolve, reject) => {
    Accounts.callLoginMethod({
      methodArguments: [
        {
          totp: {
            login: {
              user: userDescriptor,
              password: Accounts._hashPassword(password),
            },
            code,
          },
        },
      ],
      userCallback(error) {
        if (!error) {
          callback?.(undefined);
          resolve();
          return;
        }

        callback?.(error);
        resolve();
      },
    });
  });
};


const { loginWithPassword } = Meteor;

Meteor.loginWithPassword = (
	userDescriptor: { username: string } | { email: string } | { id: string } | string,
	password: string,
	callback?: LoginCallback,
) => {
	overrideLoginMethod(loginWithPassword, [userDescriptor, password], callback, loginWithPasswordAndTOTP);
};
