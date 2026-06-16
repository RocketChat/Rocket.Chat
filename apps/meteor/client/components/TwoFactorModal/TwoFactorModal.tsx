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
	invalidAttempt?: boolean;
} & (
	| {
			method: 'totp' | 'password';
	  }
	| {
			method: 'email';
			emailOrUsername: string;
			challengeId?: never;
	  }
	| {
			method: 'email';
			challengeId: string;
			emailOrUsername?: never;
	  }
);

const TwoFactorModal = ({ onConfirm, onClose, invalidAttempt, ...props }: TwoFactorModalProps) => {
	if (props.method === Method.TOTP) {
		return <TwoFactorTotp onConfirm={onConfirm} onClose={onClose} invalidAttempt={invalidAttempt} />;
	}

	if (props.method === Method.EMAIL) {
		// const { emailOrUsername, challengeId } = props;

		return <TwoFactorEmail onConfirm={onConfirm} onClose={onClose} invalidAttempt={invalidAttempt} {...props} />;
	}

	if (props.method === Method.PASSWORD) {
		return <TwoFactorPassword onConfirm={onConfirm} onClose={onClose} invalidAttempt={invalidAttempt} />;
	}

	throw new Error('Invalid Two Factor method');
};

export default TwoFactorModal;
