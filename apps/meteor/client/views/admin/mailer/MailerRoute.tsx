import { useToastMessageDispatch, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import { Mailer } from './Mailer';

export type sendMailObject = {
	fromEmail: { value: string; error?: string };
	subject: string;
	emailBody: string;
	dryRun: boolean;
	query: { value: string; error?: string };
};

type useSendMailType = () => ({ fromEmail, subject, emailBody, dryRun, query }: sendMailObject) => void;

const useSendMail: useSendMailType = () => {
	const meteorSendMail = useEndpoint('POST', '/v1/mailer');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	return ({ fromEmail, subject, emailBody, dryRun, query }): void => {
		if (query.error) {
			dispatchToastMessage({
				type: 'error',
				message: t('Query_is_not_valid_JSON'),
			});
			return;
		}
		if (fromEmail.error || fromEmail.value.length < 1) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-invalid-from-address'),
			});
			return;
		}
		if (emailBody.indexOf('[unsubscribe]') === -1) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-missing-unsubscribe-link'),
			});
			return;
		}

		meteorSendMail({ from: fromEmail.value, subject, body: emailBody, dryrun: dryRun, query: query.value });
		dispatchToastMessage({
			type: 'success',
			message: t('The_emails_are_being_sent'),
		});
	};
};

export default function MailerRoute(): ReactElement {
	const canAccessMailer = usePermission('access-mailer');
	const sendMail = useSendMail();

	if (!canAccessMailer) {
		return <NotAuthorizedPage />;
	}

	return <Mailer sendMail={sendMail} />;
}
