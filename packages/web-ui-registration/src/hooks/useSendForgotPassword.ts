import { useEndpoint } from '@rocket.chat/ui-contexts';

export const useSendForgotPassword = () => {
	const forgot = useEndpoint('POST', '/v1/users.forgotPassword');

	return forgot;
};

// 	if (state === 'forgot-password') {
// 		Meteor.call('sendForgotPasswordEmail', formData.email?.trim(), (error) => {
// 			if (error) {
// 				dispatchToastMessage({ type: 'error', message: error });
// 				return instance.state.set('login');
// 			}
// 			instance.loading.set(false);
// 			callbacks.run('userForgotPasswordEmailRequested');
// 			dispatchToastMessage({ type: 'success', message: t('If_this_email_is_registered') });
// 			return instance.state.set('login');
// 		});
// 		return;
// 	}
