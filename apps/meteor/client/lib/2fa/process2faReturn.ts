import { Meteor } from 'meteor/meteor';
import { SHA256 } from 'meteor/sha';

import TwoFactorModal from '../../components/TwoFactorModal';
import { imperativeModal } from '../imperativeModal';
import { isTotpRequiredError } from './utils';

const twoFactorMethods = ['totp', 'email', 'password'] as const;

type TwoFactorMethod = typeof twoFactorMethods[number];

const isTwoFactorMethod = (method: string): method is TwoFactorMethod => twoFactorMethods.includes(method as TwoFactorMethod);

const hasRequiredTwoFactorMethod = (
	error: Meteor.Error,
): error is Meteor.Error & { details: { method: TwoFactorMethod; emailOrUsername?: string } } => {
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

export function process2faReturn({
	error,
	result,
	originalCallback,
	onCode,
	emailOrUsername,
}: {
	error: unknown;
	result: unknown;
	originalCallback: {
		(error: unknown): void;
		(error: unknown, result: unknown): void;
	};
	onCode: (code: string, method: string) => void;
	emailOrUsername: string | null | undefined;
}): void {
	if (!isTotpRequiredError(error) || !hasRequiredTwoFactorMethod(error)) {
		originalCallback(error, result);
		return;
	}

	const props = {
		method: error.details.method,
		emailOrUsername: emailOrUsername || error.details.emailOrUsername || Meteor.user()?.username,
	};

	assertModalProps(props);

	imperativeModal.open({
		component: TwoFactorModal,
		props: {
			...props,
			onConfirm: (code: string, method: string): void => {
				imperativeModal.close();
				onCode(method === 'password' ? SHA256(code) : code, method);
			},
			onClose: (): void => {
				imperativeModal.close();
				originalCallback(new Meteor.Error('totp-canceled'));
			},
		},
	});
}
