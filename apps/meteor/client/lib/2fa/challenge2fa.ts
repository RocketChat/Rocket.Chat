import type { TwoFactorErrorResponse, TwoFactorMethod } from '@rocket.chat/api-client';
import { isTotpInvalidError, isTotpRequiredError, hasRequiredTwoFactorMethod, isTotpMaxAttemptsError } from '@rocket.chat/api-client';
import { SHA256 } from '@rocket.chat/sha256';
import { imperativeModal } from '@rocket.chat/ui-client';
import { lazy } from 'react';

import type { LoginCallback } from './overrideLoginMethod';
import type { MeteorErrorLike } from './types';
import { getUser } from '../user';

const TwoFactorModal = lazy(() => import('../../components/TwoFactorModal'));

type RejectChallenge = (error: TwoFactorErrorResponse) => void;
type OnConfirm = (twoFactorCode: string) => Promise<void>;
type OnClose = () => void;
type UnresolvedChallenge = {
	onConfirm: OnConfirm;
	rejectChallenge: RejectChallenge;
	onClose: OnClose;
};

let unresolvedChallenge: undefined | UnresolvedChallenge = undefined;

const saveChallenge = (challenge: UnresolvedChallenge) => {
	unresolvedChallenge = challenge;
};

const wrapWithClearChallenge = (cb: () => void) => () => {
	unresolvedChallenge = undefined;
	cb();
};

const makeResolvablePromise = <T>() => {
	let resolve: undefined | ((value: T) => void) = undefined;
	let reject: undefined | ((error: unknown) => void) = undefined;
	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	if (!resolve || !reject) {
		throw new Error('Failed to create resolvable promise');
	}

	return [promise, resolve as (value: T | PromiseLike<T>) => void, reject as (error: unknown) => void] as const;
};

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

function assertModalProps(props: {
	method: TwoFactorMethod;
	emailOrUsername?: string;
}): asserts props is { method: 'totp' } | { method: 'password' } | { method: 'email'; emailOrUsername: string } {
	if (props.method === 'email' && typeof props.emailOrUsername !== 'string') {
		throw new Error('Invalid Two Factor method');
	}
}

type Request2faPromptOptions = {
	error: TwoFactorErrorResponse;
	emailOrUsername?: string;
	errorHandler?: LoginCallback | null;
};

export const challenge2fa = ({
	error,
	emailOrUsername,
	errorHandler,
}: Request2faPromptOptions): [Promise<string>, () => void] | undefined => {
	if (isTotpMaxAttemptsError(error)) {
		Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
			dispatchToastMessage({
				type: 'error',
				message: t('Two-factor_authentication_cancelled'),
			});
		});
	}
	if ((!isTotpRequiredError(error) && !isTotpInvalidError(error)) || !hasRequiredTwoFactorMethod(error)) {
		if (unresolvedChallenge) {
			unresolvedChallenge.rejectChallenge(error);
		}

		if (typeof errorHandler === 'function') {
			errorHandler(error as MeteorErrorLike);
			return;
		}

		throw error;
	}

	const twoFactorMethod = 'details' in error ? error.details.method : 'password';

	const [code, resolveCode, rejectCode] = makeResolvablePromise<string>();
	const [challengePromise, resolveChallenge, rejectChallengePromise] = makeResolvablePromise<void>();

	const onConfirm = async (twoFactorCode: string): Promise<void> => {
		const actualCode = twoFactorMethod === 'password' ? SHA256(twoFactorCode) : twoFactorCode;
		resolveCode(actualCode);
		await challengePromise;
	};

	const onClose = () => {
		rejectCode(new Error('totp-cancelled'));
		imperativeModal.close();
	};

	const rejectChallenge = (error: TwoFactorErrorResponse) => {
		rejectChallengePromise(error);
	};

	if (unresolvedChallenge) {
		unresolvedChallenge.rejectChallenge(error);
		saveChallenge({ onConfirm, rejectChallenge, onClose });
		return [code, wrapWithClearChallenge(resolveChallenge)];
	}

	saveChallenge({ onConfirm, rejectChallenge, onClose });

	const method = error.details.method ? error.details.method : 'password';

	const props = getProps(method, emailOrUsername || error.details.emailOrUsername || getUser()?.username);

	assertModalProps(props);

	imperativeModal.open({
		component: TwoFactorModal,
		props: {
			...props,
			onConfirm,
			onClose,
		},
	});

	return [code, wrapWithClearChallenge(resolveChallenge)];
};
