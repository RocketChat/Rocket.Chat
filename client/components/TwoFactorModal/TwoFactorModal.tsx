import React, { ReactElement } from 'react';

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
	method: Method;
	onConfirm: OnConfirm;
	onClose: () => void;
	emailOrUsername: string;
};

const TwoFactorModal = ({
	method,
	onConfirm,
	onClose,
	emailOrUsername,
}: TwoFactorModalProps): ReactElement => {
	if (method === Method.TOTP) {
		return <TwoFactorTotp onConfirm={onConfirm} onClose={onClose} />;
	}

	if (method === Method.EMAIL) {
		return (
			<TwoFactorEmail onConfirm={onConfirm} onClose={onClose} emailOrUsername={emailOrUsername} />
		);
	}

	if (method === Method.PASSWORD) {
		return <TwoFactorPassword onConfirm={onConfirm} onClose={onClose} />;
	}

	throw new Error('Invalid Two Factor method');
};

export default TwoFactorModal;
