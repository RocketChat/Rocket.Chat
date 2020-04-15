import React from 'react';
import toastr from 'toastr';

import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { Mailer } from './Mailer';
import { NotAuthorizedPage } from '../settings/NotAuthorizedPage';


const useSendMail = () => {
	const meteorSendMail = useMethod('Mailer.sendMail');
	const t = useTranslation();
	return ({ fromEmail, subject, emailBody, dryRun, query }) => {
		if (query.error) {
			toastr.error(t('Query_is_not_valid_JSON'));
			return;
		}
		if (fromEmail.error || fromEmail.length < 1) {
			toastr.error(t('error-invalid-from-address'));
			return;
		}
		if (emailBody.indexOf('[unsubscribe]') === -1) {
			toastr.error(t('error-missing-unsubscribe-link'));
			return;
		}
		meteorSendMail(fromEmail.value, subject, emailBody, dryRun, query.value);
		toastr.success(t('The_emails_are_being_sent'));
	};
};

export default function MailerRoute(props) {
	const canAccessMailer = usePermission('access-mailer');
	const sendMail = useSendMail();

	return canAccessMailer ? <Mailer sendMail={sendMail} {...props} /> : <NotAuthorizedPage/>;
}
