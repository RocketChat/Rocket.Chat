import { useEndpoint, useRouteParameter } from '@rocket.chat/ui-contexts';

import { useLoginMethod } from './useLoginMethod';

export const useRegisterMethod = () => {
	const login = useLoginMethod();
	const register = useEndpoint('POST', '/v1/users.register');
	const secret = useRouteParameter('hash');

	return ({ ...props }: Parameters<typeof register>[0]): ReturnType<typeof register> => register({ ...props, secret });

	// 	if (state === 'register') {
	// 		formData.secretURL = FlowRouter.getParam('hash');
	// 		return Meteor.call('registerUser', formData, function (error) {
	// 			instance.loading.set(false);
	// 			if (error != null) {
	// 				if (error.reason === 'Email already exists.') {
	// 					dispatchToastMessage({ type: 'error', message: t('Email_already_exists') });
	// 				} else {
	// 					dispatchToastMessage({ type: 'error', message: error });
	// 				}
	// 				return;
	// 			}
	// 			callbacks.run('userRegistered');
	// 			return Meteor.loginWithPassword(formData.email?.trim(), formData.pass, function (error) {
	// 				if (error && error.error === 'error-invalid-email') {
	// 					return instance.state.set('wait-email-activation');
	// 				}
	// 				if (error && error.error === 'error-user-is-not-activated') {
	// 					return instance.state.set('wait-activation');
	// 				}
	// 				Session.set('forceLogin', false);
	// 				if (formData.secretURL) {
	// 					FlowRouter.go('home');
	// 				}
	// 			});
	// 		});
	// 	}
};
