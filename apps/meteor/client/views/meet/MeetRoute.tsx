import { useEndpoint, useRouter, useSearchParameter, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import MeetPage from './MeetPage';
import { VisitorDoesNotExistError } from '../../lib/errors/VisitorDoesNotExistError';
import PageLoading from '../root/PageLoading';

const MeetRoute = () => {
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const uid = useUserId();
	const token = useSearchParameter('token') ?? '';
	const getVisitorByToken = useEndpoint('GET', '/v1/livechat/visitor/:token', { token });

	const { data: hasVisitor, error } = useQuery({
		queryKey: ['meet', { token }],

		queryFn: async () => {
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
	});

	useEffect(() => {
		if (error) {
			if (error instanceof VisitorDoesNotExistError) {
				dispatchToastMessage({ type: 'error', message: t('core.Visitor_does_not_exist') });
				return;
			}

			dispatchToastMessage({ type: 'error', message: error });
		}

		if (!hasVisitor) {
			router.navigate('/home');
		}
	}, [hasVisitor, error, router, dispatchToastMessage, t]);

	if (!hasVisitor) {
		return <PageLoading />;
	}

	return <MeetPage />;
};

export default MeetRoute;
