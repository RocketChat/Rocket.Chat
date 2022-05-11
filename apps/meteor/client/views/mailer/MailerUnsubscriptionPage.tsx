import { Box, Callout, Throbber } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useRouteParameter, useAbsoluteUrl, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useEffect } from 'react';

import { AsyncState, AsyncStatePhase, useAsyncState } from '../../hooks/useAsyncState';

const useMailerUnsubscriptionState = (): AsyncState<boolean> => {
	const { resolve, reject, ...unsubscribedState } = useAsyncState<boolean>();

	const unsubscribe = useMethod('Mailer:unsubscribe');
	const _id = useRouteParameter('_id');
	const createdAt = useRouteParameter('createdAt');
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		const doUnsubscribe = async (_id: string, createdAt: string): Promise<void> => {
			try {
				await unsubscribe(_id, createdAt);
				resolve(true);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				reject(error);
			}
		};

		if (!_id || !createdAt) {
			return;
		}

		doUnsubscribe(_id, createdAt);
	}, [resolve, reject, unsubscribe, _id, createdAt, dispatchToastMessage]);

	return unsubscribedState;
};

const MailerUnsubscriptionPage: FC = () => {
	const { phase, error } = useMailerUnsubscriptionState();

	const t = useTranslation();
	const absoluteUrl = useAbsoluteUrl();

	return (
		<section className='rc-old full-page color-tertiary-font-color'>
			<div className='wrapper'>
				<header>
					<a className='logo' href={absoluteUrl('/')}>
						<img src={absoluteUrl('/images/logo/logo.svg')} />
					</a>
				</header>
				<Box color='default' marginInline='auto' marginBlock={16} maxWidth={800}>
					{(phase === AsyncStatePhase.LOADING && <Throbber disabled />) ||
						(phase === AsyncStatePhase.REJECTED && <Callout type='danger' title={error?.message} />) ||
						(phase === AsyncStatePhase.RESOLVED && <Callout type='success' title={t('You_have_successfully_unsubscribed')} />)}
				</Box>
			</div>
		</section>
	);
};

export default MailerUnsubscriptionPage;
