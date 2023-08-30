import { Box, Skeleton } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItemCorrect } from './PasswordVerifierCorrect';
import { PasswordVerifierItemInvalid } from './PasswordVerifierInvalid';

type PasswordVerifierProps = {
	password: string;
	id?: string;
};

export const PasswordVerifier = ({ password, id }: PasswordVerifierProps) => {
	const { t } = useTranslation();
	const uniqueId = useUniqueId();

	const { data: passwordVerifications, isLoading } = useVerifyPassword(password);

	if (isLoading) {
		return <Skeleton data-testid='password-verifier-skeleton' w='full' mbe={8} />;
	}

	if (!passwordVerifications?.length) {
		return null;
	}

	return (
		<>
			<span id={id} hidden>
				{t('Password_Policy_Aria_Description')}
			</span>
			<Box display='flex' flexDirection='column' mbs={8}>
				<Box mbe={8} fontScale='c2' id={uniqueId} aria-hidden>
					{t('Password_must_have')}
				</Box>
				<Box display='flex' flexWrap='wrap' role='list' aria-labelledby={uniqueId}>
					{passwordVerifications.map(({ isValid, limit, name }) =>
						isValid ? (
							<PasswordVerifierItemCorrect key={name} text={t(`${name}-label`, { limit })} />
						) : (
							<PasswordVerifierItemInvalid key={name} text={t(`${name}-label`, { limit })} />
						),
					)}
				</Box>
			</Box>
		</>
	);
};
