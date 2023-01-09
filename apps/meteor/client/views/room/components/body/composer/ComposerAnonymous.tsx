import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

export const ComposerAnonymous = (): ReactElement => {
	const isAnonymousWriteEnabled = useSetting('Accounts_AllowAnonymousWrite');
	// 'click .js-register'(event: JQuery.ClickEvent) {
	// 	event.stopPropagation();
	// 	event.preventDefault();

	// 	Session.set('forceLogin', true);
	// },
	// async 'click .js-register-anonymous'(event: JQuery.ClickEvent) {
	// 	event.stopPropagation();
	// 	event.preventDefault();

	// 	const { token } = await call('registerUser', {});
	// 	Meteor.loginWithToken(token);
	// },

	const t = useTranslation();
	return (
		<div className='rc-button-group'>
			<button className='rc-button rc-button--primary rc-button--small js-register'>{t('Sign_in_to_start_talking')}</button>
			{isAnonymousWriteEnabled && <button className='rc-button rc-button--small js-register-anonymous'>{t('Or_talk_as_anonymous')}</button>}
		</div>
	);
};
