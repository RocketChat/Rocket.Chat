import { Box } from '@rocket.chat/fuselage';
import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItemCorrect } from './PasswordVerifierCorrect';
import { PasswordVerifierItemInvalid } from './PasswordVerifierInvalid';

type PasswordVerifierProps = {
	password: string;
};

export const PasswordVerifier = ({ password }: PasswordVerifierProps) => {
	const { t } = useTranslation();

	const passwordVerifications = useVerifyPassword(password);

	if (!passwordVerifications.length) {
		return <></>;
	}

	return (
		<Box display='flex' flexDirection='column' mbs={8}>
			<Box mbe={8} fontScale='c2'>
				{t('Password_must_have')}
			</Box>
			<Box display='flex' flexWrap='wrap'>
				{passwordVerifications.map(({ isValid, limit, name }) =>
					isValid ? (
						<PasswordVerifierItemCorrect key={name} text={t(`${name}-label`, { limit })} />
					) : (
						<PasswordVerifierItemInvalid key={name} text={t(`${name}-label`, { limit })} />
					),
				)}
			</Box>
		</Box>
	);
};
