import { SHA256 } from '@rocket.chat/sha256';
import { imperativeModal } from '@rocket.chat/ui-client';
import { lazy } from 'react';

import type { LoginCallback } from './overrideLoginMethod';
import type { MeteorErrorLike } from './types';
import { isTotpInvalidError, isTotpRequiredError } from './utils';
import { getUser } from '../user';

const TwoFactorModal = lazy(() => import('../../components/TwoFactorModal'));

const twoFactorMethods = ['totp', 'email', 'password'] as const;

type TwoFactorMethod = (typeof twoFactorMethods)[number];

const isTwoFactorMethod = (method: string): method is TwoFactorMethod => twoFactorMethods.includes(method as TwoFactorMethod);

const hasRequiredTwoFactorMethod = (
	error: MeteorErrorLike,
): error is MeteorErrorLike & { details: { method: TwoFactorMethod; emailOrUsername?: string } } => {
	const details = error.details as unknown;

	return (
		typeof details === 'object' &&
		details !== null &&
		typeof (details as { method: unknown }).method === 'string' &&
		isTwoFactorMethod((details as { method: string }).method)
	);
};

function assertModalProps(props: {
	method: TwoFactorMethod;
	emailOrUsername?: string;
}): asserts props is { method: 'totp' } | { method: 'password' } | { method: 'email'; emailOrUsername: string } {
	if (props.method === 'email' && typeof props.emailOrUsername !== 'string') {
		throw new Error('Invalid Two Factor method');
	}
}

const getProps = (
	method: 'totp' | 'email' | 'password',
	emailOrUsername?: { username: string } | { email: string } | { id: string } | string,
) => {
	switch (method) {
		case 'totp':
			return { method };
		case 'email':
			return {
				method,
				emailOrUsername: typeof emailOrUsername === 'string' ? emailOrUsername : getUser()?.username,
			};
		case 'password':
			return { method };
	}
};

export async function process2faReturn({
	error,
	result,
	originalCallback,
	onCode,
	emailOrUsername,
}: {
	error: MeteorErrorLike | undefined;
	result: unknown;
	originalCallback: LoginCallback | undefined;
	onCode: (code: string, method: string) => void | Promise<void>;
	emailOrUsername: { username: string } | { email: string } | { id: string } | string | null | undefined;
}): Promise<void> {
	if (!(isTotpRequiredError(error) || isTotpInvalidError(error)) || !hasRequiredTwoFactorMethod(error)) {
		originalCallback?.(error, result);
		return;
	}

	const props = {
		...getProps(error.details.method, emailOrUsername || error.details.emailOrUsername),
	};

	const validateCode = async (code: string, method: string): Promise<void> => {
		await onCode(code, method);
	};

	await invokeTwoFactorModal(props, validateCode);
}

export async function process2faAsyncReturn<TResult>({
	error,
	onCode,
	emailOrUsername,
}: {
	error: unknown;
	onCode: (code: string, method: string) => TResult | Promise<TResult>;
	emailOrUsername: string | null | undefined;
}): Promise<TResult> {
	// if the promise is rejected, we need to check if it's a 2fa error
	// if it's not a 2fa error, we reject the promise
	if (!(isTotpRequiredError(error) || isTotpInvalidError(error)) || !hasRequiredTwoFactorMethod(error)) {
		throw error;
	}

	const props = {
		method: error.details.method,
		emailOrUsername: emailOrUsername || error.details.emailOrUsername || getUser()?.username,
	};

	assertModalProps(props);

	let result: TResult | undefined;

	const validateCode = async (code: string, method: string): Promise<void> => {
		result = await onCode(code, method);
	};

	await invokeTwoFactorModal(props, validateCode);

	if (result === undefined) {
		throw new Error('Unexpected error: result is undefined');
	}

	return result;
}

export const invokeTwoFactorModal = async (
	props: {
		method: 'totp' | 'email' | 'password';
		emailOrUsername?: string | undefined;
	},
	validateCode?: (code: string, method: string) => Promise<void>,
) => {
	assertModalProps(props);

	return new Promise<string>((resolve, reject) => {
		let isResolved = false;
		let isClosed = false;

		imperativeModal.open({
			component: TwoFactorModal,
			props: {
				...props,
				onConfirm: async (code: string, method: string): Promise<void> => {
					if (validateCode) {
						await validateCode(code, method);
					}
					isResolved = true;
					imperativeModal.close();
					resolve(method === 'password' ? SHA256(code) : code);
				},
				onClose: (): void => {
					if (isClosed) {
						return;
					}
					isClosed = true;
					imperativeModal.close();
					if (!isResolved) {
						Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
							dispatchToastMessage({
								type: 'error',
								message: t('Two-factor_authentication_cancelled'),
							});
						});
						reject(new Error('totp-canceled'));
					}
				},
			},
		});
	});
};
