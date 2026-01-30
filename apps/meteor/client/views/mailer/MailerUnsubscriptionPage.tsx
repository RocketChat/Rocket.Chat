import { Box, Callout, Throbber } from '@rocket.chat/fuselage';
import { HeroLayout } from '@rocket.chat/layout';
import { useToastMessageDispatch, useRouteParameter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const useMailerUnsubscriptionMutation = () => {
	const unsubscribe = useEndpoint('POST', '/v1/mailer.unsubscribe');
	const _id = useRouteParameter('_id');
	const createdAt = useRouteParameter('createdAt');
	const dispatchToastMessage = useToastMessageDispatch();

	const mutation = useMutation({
		mutationFn: async ({ _id, createdAt }: { _id: string; createdAt: string }) => {
			await unsubscribe({ _id, createdAt });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	useEffect(() => {
		if (!_id || !createdAt) {
			return;
		}

		mutation.mutate.call(null, { _id, createdAt });
	}, [_id, createdAt, mutation.mutate]);

	return mutation;
};

const MailerUnsubscriptionPage = () => {
	const { t } = useTranslation();
	const { isIdle, isPending, isError, error, isSuccess } = useMailerUnsubscriptionMutation();

	return (
		<HeroLayout>
			<Box color='default' marginInline='auto' marginBlock={16} maxWidth={800}>
				{((isIdle || isPending) && <Throbber disabled />) ||
					(isError && <Callout type='danger' title={error.message} />) ||
					(isSuccess && <Callout type='success' title={t('You_have_successfully_unsubscribed')} />)}
			</Box>
		</HeroLayout>
	);
};

export default MailerUnsubscriptionPage;
