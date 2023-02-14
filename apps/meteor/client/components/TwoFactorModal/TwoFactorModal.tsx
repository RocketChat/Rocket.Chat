import { useEndpoint } from '@rocket.chat/ui-contexts';
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
	onConfirm: OnConfirm;
	onClose: () => void;
} & (
	| {
			method: 'totp' | 'password';
	  }
	| {
			method: 'email';
			emailOrUsername: string;
	  }
);

const TwoFactorModal = ({ onConfirm, onClose, ...props }: TwoFactorModalProps): ReactElement => {
	const logoutOtherSessions = useEndpoint('POST', '/v1/users.logoutOtherClients');

	const confirm = (code: any, method: Method): void => {
		onConfirm(code, method);
		logoutOtherSessions();
	};
	if (props.method === Method.TOTP) {
		return <TwoFactorTotp onConfirm={confirm} onClose={onClose} />;
	}

	if (props.method === Method.EMAIL) {
		const { emailOrUsername } = props;

		return <TwoFactorEmail onConfirm={confirm} onClose={onClose} emailOrUsername={emailOrUsername} />;
	}

	if (props.method === Method.PASSWORD) {
		return <TwoFactorPassword onConfirm={confirm} onClose={onClose} />;
	}

	throw new Error('Invalid Two Factor method');
};

export default TwoFactorModal;
