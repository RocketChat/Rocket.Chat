import { Box, Callout, Throbber } from '@rocket.chat/fuselage';
import { HeroLayout } from '@rocket.chat/layout';
import { useToastMessageDispatch, useRouteParameter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { AsyncState } from '../../hooks/useAsyncState';
import { AsyncStatePhase, useAsyncState } from '../../hooks/useAsyncState';

const useMailerUnsubscriptionState = (): AsyncState<boolean> => {
	const { resolve, reject, ...unsubscribedState } = useAsyncState<boolean>();

	const unsubscribe = useEndpoint('POST', '/v1/mailer.unsubscribe');
	const _id = useRouteParameter('_id');
	const createdAt = useRouteParameter('createdAt');
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const doUnsubscribe = async (_id: string, createdAt: string): Promise<void> => {
			try {
				await unsubscribe({ _id, createdAt });
				resolve(true);
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		};

		if (!_id || !createdAt) {
			return;
		}

		doUnsubscribe(_id, createdAt);
	}, [resolve, reject, unsubscribe, _id, createdAt, dispatchToastMessage]);

	return unsubscribedState;
};

const MailerUnsubscriptionPage = () => {
	const { phase, error } = useMailerUnsubscriptionState();

	const { t } = useTranslation();

	return (
		<HeroLayout>
			<Box color='default' marginInline='auto' marginBlock={16} maxWidth={800}>
				{(phase === AsyncStatePhase.LOADING && <Throbber disabled />) ||
					(phase === AsyncStatePhase.REJECTED && <Callout type='danger' title={error?.message} />) ||
					(phase === AsyncStatePhase.RESOLVED && <Callout type='success' title={t('You_have_successfully_unsubscribed')} />)}
			</Box>
		</HeroLayout>
	);
};

export default MailerUnsubscriptionPage;
