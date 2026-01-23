import { useVerifyPassword } from '@rocket.chat/ui-contexts';

import { PasswordVerifierList, type PasswordVerifierListProps } from './PasswordVerifierList';

export type PasswordVerifierProps = Pick<PasswordVerifierListProps, 'id' | 'vertical'> & {
	password: string;
};

export const PasswordVerifier = ({ password, id, vertical }: PasswordVerifierProps) => {
	const { validations } = useVerifyPassword(password || '');
	return <PasswordVerifierList id={id} validations={validations} vertical={vertical} />;
};
