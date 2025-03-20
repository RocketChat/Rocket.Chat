import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { NotOnDesktopError } from '../lib/NotOnDesktopError';

export const useOutlookAuthentication = () => {
	const {
		data: authEnabled,
		isError,
		error,
	} = useQuery({
		queryKey: ['outlook', 'auth'],

		queryFn: async () => {
			const desktopApp = window.RocketChatDesktop;
			if (!desktopApp?.hasOutlookCredentials) {
				throw new NotOnDesktopError();
			}

			return Boolean(await desktopApp?.hasOutlookCredentials?.()) || false;
		},
	});

	return { authEnabled: Boolean(authEnabled), isError, error };
};

export const useOutlookAuthenticationMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await queryClient.invalidateQueries({
				queryKey: ['outlook', 'auth'],
			});
		},
	});
};

export const useOutlookAuthenticationMutationLogout = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const mutation = useOutlookAuthenticationMutation();
	return useMutation({
		mutationFn: async () => {
			const desktopApp = window.RocketChatDesktop;
			if (!desktopApp?.clearOutlookCredentials) {
				throw new NotOnDesktopError();
			}

			await desktopApp.clearOutlookCredentials();

			return mutation.mutateAsync();
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Outlook_authentication_disabled') });
		},
	});
};
