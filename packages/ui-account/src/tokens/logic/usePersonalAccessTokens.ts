import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { NewPersonalAccessToken, PersonalAccessToken } from './personalAccessTokens';

export const personalAccessTokensQueryKey = ['personal-access-tokens'] as const;

export type PersonalAccessTokensDialog =
	| { type: 'confirm-regenerate'; tokenName: string }
	| { type: 'confirm-remove'; tokenName: string }
	| { type: 'token-generated'; token: string };

export type PersonalAccessTokensViewModel = {
	status: 'loading' | 'error' | 'ready';
	errorMessage?: string;
	tokens: PersonalAccessToken[];
	userId: string | undefined;
	dialog: PersonalAccessTokensDialog | null;
	create: (token: NewPersonalAccessToken) => Promise<boolean>;
	requestRegenerate: (tokenName: string) => void;
	requestRemove: (tokenName: string) => void;
	confirmDialog: () => Promise<void>;
	dismissDialog: () => void;
	retry: () => void;
};

export const usePersonalAccessTokens = (): PersonalAccessTokensViewModel => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const userId = useUserId();
	const queryClient = useQueryClient();
	const [dialog, setDialog] = useState<PersonalAccessTokensDialog | null>(null);

	const getTokens = useEndpoint('GET', '/v1/users.getPersonalAccessTokens');
	const generateToken = useEndpoint('POST', '/v1/users.generatePersonalAccessToken');
	const regenerateToken = useEndpoint('POST', '/v1/users.regeneratePersonalAccessToken');
	const removeToken = useEndpoint('POST', '/v1/users.removePersonalAccessToken');

	const { isPending, isError, error, data } = useQuery({
		queryKey: personalAccessTokensQueryKey,
		queryFn: () => getTokens(),
	});

	const retry = useStableCallback(() => {
		void queryClient.invalidateQueries({ queryKey: personalAccessTokensQueryKey });
	});

	const create = useStableCallback(async (token: NewPersonalAccessToken) => {
		try {
			const { token: generated } = await generateToken(token);
			setDialog({ type: 'token-generated', token: generated });
			retry();
			return true;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return false;
		}
	});

	const requestRegenerate = useStableCallback((tokenName: string) => setDialog({ type: 'confirm-regenerate', tokenName }));
	const requestRemove = useStableCallback((tokenName: string) => setDialog({ type: 'confirm-remove', tokenName }));
	const dismissDialog = useStableCallback(() => setDialog(null));

	const confirmDialog = useStableCallback(async () => {
		if (dialog?.type === 'confirm-regenerate') {
			setDialog(null);
			try {
				const { token } = await regenerateToken({ tokenName: dialog.tokenName });
				setDialog({ type: 'token-generated', token });
				retry();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			return;
		}

		if (dialog?.type === 'confirm-remove') {
			try {
				await removeToken({ tokenName: dialog.tokenName });
				dispatchToastMessage({ type: 'success', message: t('Token_has_been_removed') });
				retry();
				setDialog(null);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			return;
		}

		setDialog(null);
	});

	const getStatus = (): PersonalAccessTokensViewModel['status'] => {
		if (isPending) return 'loading';
		if (isError) return 'error';
		return 'ready';
	};

	return {
		status: getStatus(),
		errorMessage: error?.message,
		tokens: data?.tokens ?? [],
		userId,
		dialog,
		create,
		requestRegenerate,
		requestRemove,
		confirmDialog,
		dismissDialog,
		retry,
	};
};
