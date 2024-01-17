import { useEndpoint, useRouter, useSearchParameter, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { VisitorDoesNotExistError } from '../../lib/errors/VisitorDoesNotExistError';
import PageLoading from '../root/PageLoading';
import MeetPage from './MeetPage';

const MeetRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const uid = useUserId();
	const token = useSearchParameter('token') ?? '';
	const getVisitorByToken = useEndpoint('GET', '/v1/livechat/visitor/:token', { token });

	const { data: hasVisitor } = useQuery(
		['meet', { token }],
		async () => {
			if (token) {
				const result = await getVisitorByToken();
				if ('visitor' in result) {
					return true;
				}

				throw new VisitorDoesNotExistError();
			}

			if (!uid) {
				return false;
			}

			return true;
		},
		{
			onSuccess: (hasVisitor) => {
				if (hasVisitor === false) {
					router.navigate('/home');
				}
			},
			onError: (error) => {
				if (error instanceof VisitorDoesNotExistError) {
					dispatchToastMessage({ type: 'error', message: t('core.Visitor_does_not_exist') });
					router.navigate('/home');
					return;
				}

				dispatchToastMessage({ type: 'error', message: error });
				router.navigate('/home');
			},
		},
	);

	if (!hasVisitor) {
		return <PageLoading />;
	}

	return <MeetPage />;
};

export default MeetRoute;
