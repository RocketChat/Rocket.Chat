import type { TwoFactorMethod } from '@rocket.chat/api-client';
import { isTotpInvalidError, isTotpRequiredError, hasRequiredTwoFactorMethod, isTotpMaxAttemptsError } from '@rocket.chat/api-client';
import { SHA256 } from '@rocket.chat/sha256';
import { imperativeModal } from '@rocket.chat/ui-client';
import { lazy } from 'react';

import { getUser } from '../user';

const TwoFactorModal = lazy(() => import('../../components/TwoFactorModal'));

type RejectChallenge = (error: unknown) => void;
type OnConfirm = (twoFactorCode: string) => Promise<void>;
type OnClose = () => void;
type UnresolvedChallenge = {
	onConfirm: OnConfirm;
	rejectChallenge: RejectChallenge;
	onClose: OnClose;
};

// This is a "store" for callbacks that need to be accessed outside of the challenge2fa function's scope
// e.g. We cannot update modal props, so callbacks that can change are stored here, and then wrapped in another function
// that will call whatever is present here.
let unresolvedChallenge: undefined | UnresolvedChallenge = undefined;

const saveChallenge = (challenge: UnresolvedChallenge) => {
	unresolvedChallenge = challenge;
};

const endChallenge = (rejectError?: unknown) => {
	if (rejectError) {
		unresolvedChallenge?.rejectChallenge(rejectError);
	}
	unresolvedChallenge = undefined;
	imperativeModal.close();
};

const wrapWithEndChallenge = (cb: () => void) => () => {
	endChallenge();
	cb();
};

// Helper to extract the resolvers from a promise without TS complaining the functions might not exist
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
	error: unknown;
	emailOrUsername?: string;
};

export const challenge2fa = ({ error, emailOrUsername }: Request2faPromptOptions): [Promise<string>, () => void] | undefined => {
	if (isTotpMaxAttemptsError(error)) {
		Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
			dispatchToastMessage({
				type: 'error',
				message: t('totp-max-attempts'),
			});
		});

		if (unresolvedChallenge) {
			endChallenge(error);
		}

		throw error;
	}
	if ((!isTotpRequiredError(error) && !isTotpInvalidError(error)) || !hasRequiredTwoFactorMethod(error)) {
		if (unresolvedChallenge) {
			endChallenge(error);
		}

		throw error;
	}

	const twoFactorMethod = 'details' in error ? error.details.method : 'password';

	// `code` promise is resolved with the actual code
	const [code, resolveCode, rejectCode] = makeResolvablePromise<string>();
	// `challengePromise` is resolved async when the user completes the challenge
	// or rejected with the new error in case this is a retry
	const [challengePromise, resolveChallenge, rejectChallengePromise] = makeResolvablePromise<void>();

	const onConfirm = async (twoFactorCode: string): Promise<void> => {
		const actualCode = twoFactorMethod === 'password' ? SHA256(twoFactorCode) : twoFactorCode;
		resolveCode(actualCode);
		await challengePromise;
		endChallenge();
	};

	const onClose = () => {
		endChallenge();
		rejectCode(new Error('Two-factor_authentication_cancelled'));
	};

	const rejectChallenge = (error: unknown) => {
		rejectChallengePromise(error);
	};

	if (unresolvedChallenge) {
		// This is a retry, the modal will catch this error in order to show inline information
		unresolvedChallenge.rejectChallenge(error);
		saveChallenge({ onConfirm, rejectChallenge, onClose });
		return [code, wrapWithEndChallenge(resolveChallenge)];
	}

	saveChallenge({ onConfirm, rejectChallenge, onClose });

	const method = error.details.method ? error.details.method : 'password';

	const props = getProps(method, emailOrUsername || error.details.emailOrUsername || getUser()?.username);

	assertModalProps(props);

	imperativeModal.open({
		component: TwoFactorModal,
		props: {
			...props,
			onConfirm: (code) => unresolvedChallenge?.onConfirm(code),
			onClose: () => unresolvedChallenge?.onClose(),
		},
	});

	return [code, wrapWithEndChallenge(resolveChallenge)];
};
