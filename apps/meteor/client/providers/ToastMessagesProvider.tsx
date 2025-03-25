import { ToastBarProvider, useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { ToastMessagesContext } from '@rocket.chat/ui-contexts';
import type { DefaultError, Query } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { isValidElement, useEffect } from 'react';

import { getErrorMessage } from '../lib/errorHandling';
import { dispatchToastMessage, subscribeToToastMessages } from '../lib/toast';

const contextValue = {
	dispatch: dispatchToastMessage,
};

type ToastMessageInnerProviderProps = {
	children?: ReactNode;
};

const ToastMessageInnerProvider = ({ children }: ToastMessageInnerProviderProps) => {
	const dispatchToastBar = useToastBarDispatch();

	const queryClient = useQueryClient();
	const queryCacheInstance = queryClient.getQueryCache();
	queryCacheInstance.config.onError = (error: DefaultError, query: Query<unknown, unknown, unknown>) => {
		const meta = query?.meta;
		if (meta) {
			const { errorToastMessage, apiErrorToastMessage } = meta as {
				errorToastMessage?: string;
				apiErrorToastMessage?: boolean;
			};
			if (apiErrorToastMessage) {
				dispatchToastMessage({ type: 'error', message: error });
			} else if (errorToastMessage) {
				dispatchToastMessage({ type: 'error', message: errorToastMessage });
			}
		}
	};
	queryCacheInstance.config.onSuccess = (_, query: Query<unknown, unknown, unknown>) => {
		const meta = query?.meta;
		if (meta) {
			const { successToastMessage } = meta as { successToastMessage?: string };
			if (successToastMessage) {
				dispatchToastMessage({ type: 'success', message: successToastMessage });
			}
		}
	};

	useEffect(
		() =>
			subscribeToToastMessages(({ type, message, title = '', options }) => {
				if (type === 'error' && typeof message === 'object') {
					dispatchToastBar({ type, title, message: getErrorMessage(message), ...options });
					return;
				}

				if (typeof message !== 'string' && message instanceof Error) {
					message = `[${message.name}] ${message.message}`;
				}

				if (type === 'warning') {
					return;
				}

				if (isValidElement(message)) {
					dispatchToastBar({ type, title, message, ...options });
					return;
				}

				dispatchToastBar({ type, title, message: String(message), ...options });
			}),
		[dispatchToastBar],
	);

	return <ToastMessagesContext.Provider children={children} value={contextValue} />;
};

type ToastMessagesProviderProps = {
	children?: ReactNode;
};

// eslint-disable-next-line react/no-multi-comp
const ToastMessagesProvider = ({ children }: ToastMessagesProviderProps) => (
	<ToastBarProvider>
		<ToastMessageInnerProvider children={children} />
	</ToastBarProvider>
);

export default ToastMessagesProvider;
