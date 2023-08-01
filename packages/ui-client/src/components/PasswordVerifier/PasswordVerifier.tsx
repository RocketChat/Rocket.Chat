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

	if (!passwordVerifications) {
		return <></>;
	}

	return (
		<Box display='flex' flexDirection='column' mbs='x8'>
			<Box mbe='x8' fontScale='c2'>
				{t('Password_must_have')}
			</Box>
			<Box display='flex' flexWrap='wrap'>
				{[...Object.entries(passwordVerifications)].map(([key, { isValid, limit }]) =>
					isValid ? (
						<PasswordVerifierItemCorrect key={key} text={t(`${key}-label`, { limit })} />
					) : (
						<PasswordVerifierItemInvalid key={key} text={t(`${key}-label`, { limit })} />
					),
				)}
			</Box>
		</Box>
	);
};
