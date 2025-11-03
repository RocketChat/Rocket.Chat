import { useVerifyPassword } from '@rocket.chat/ui-contexts';

import { PasswordVerifierList } from './PasswordVerifierList';

type PasswordVerifierProps = {
	password: string | undefined;
	id?: string;
	vertical?: boolean;
};

export const PasswordVerifier = ({ password, id, vertical }: PasswordVerifierProps) => {
	const { validations } = useVerifyPassword(password || '');
	return <PasswordVerifierList id={id} validations={validations} vertical={vertical} />;
};
