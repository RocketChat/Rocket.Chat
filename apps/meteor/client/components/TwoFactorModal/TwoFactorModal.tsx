import type { ReactElement } from 'react';

import TwoFactorEmail from './TwoFactorEmailModal';
import TwoFactorPassword from './TwoFactorPasswordModal';
import TwoFactorTotp from './TwoFactorTotpModal';

export enum Method {
	TOTP = 'totp',
	EMAIL = 'email',
	PASSWORD = 'password',
}

export type OnConfirm = (code: string, method: Method) => void;

type TwoFactorModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	invalidAttempt?: boolean;
} & (
	| {
			method: 'totp' | 'password';
	  }
	| {
			method: 'email';
			emailOrUsername: string;
	  }
);

const TwoFactorModal = ({ onConfirm, onClose, invalidAttempt, ...props }: TwoFactorModalProps): ReactElement => {
	if (props.method === Method.TOTP) {
		return <TwoFactorTotp onConfirm={onConfirm} onClose={onClose} invalidAttempt={invalidAttempt} />;
	}

	if (props.method === Method.EMAIL) {
		const { emailOrUsername } = props;

		return <TwoFactorEmail onConfirm={onConfirm} onClose={onClose} emailOrUsername={emailOrUsername} invalidAttempt={invalidAttempt} />;
	}

	if (props.method === Method.PASSWORD) {
		return <TwoFactorPassword onConfirm={onConfirm} onClose={onClose} invalidAttempt={invalidAttempt} />;
	}

	throw new Error('Invalid Two Factor method');
};

export default TwoFactorModal;
