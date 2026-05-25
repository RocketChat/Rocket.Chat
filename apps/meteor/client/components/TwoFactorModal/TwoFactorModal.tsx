import type { ReactElement } from 'react';

import TwoFactorEmail from './TwoFactorEmailModal';
import TwoFactorPassword from './TwoFactorPasswordModal';
import TwoFactorTotp from './TwoFactorTotpModal';

export enum Method {
	TOTP = 'totp',
	EMAIL = 'email',
	PASSWORD = 'password',
}

export type OnConfirm = (code: string, method: Method) => void | Promise<void>;

type TwoFactorModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
} & (
	| {
			method: 'totp' | 'password';
	  }
	| {
			method: 'email';
			resendEmail?: () => Promise<null>;
	  }
);

const TwoFactorModal = ({ onConfirm, onClose, ...props }: TwoFactorModalProps): ReactElement => {
	if (props.method === Method.TOTP) {
		return <TwoFactorTotp onConfirm={onConfirm} onClose={onClose} />;
	}

	if (props.method === Method.EMAIL) {
		const { resendEmail } = props;

		return <TwoFactorEmail onConfirm={onConfirm} onClose={onClose} resendEmail={resendEmail} />;
	}

	if (props.method === Method.PASSWORD) {
		return <TwoFactorPassword onConfirm={onConfirm} onClose={onClose} />;
	}

	throw new Error('Invalid Two Factor method');
};

export default TwoFactorModal;
