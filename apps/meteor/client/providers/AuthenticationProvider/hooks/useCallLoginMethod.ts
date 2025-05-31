import { Accounts } from 'meteor/accounts-base';
import { useCallback } from 'react';

export const useCallLoginMethod = () => {
	return useCallback(
		(options: { loginToken?: string; token?: string; iframe?: boolean }, userCallback: ((err?: any) => void) | undefined) => {
			Accounts.callLoginMethod({
				methodArguments: [options],
				userCallback,
			});
		},
		[],
	);
};
