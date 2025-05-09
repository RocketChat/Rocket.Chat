import { Box } from '@rocket.chat/fuselage';
import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItem } from './PasswordVerifierItem';

type PasswordVerifierProps = {
	password: string | undefined;
	id?: string;
	vertical?: boolean;
};

type PasswordVerificationProps = {
	name: string;
	isValid: boolean;
	limit?: number;
}[];

export const PasswordVerifier = ({ password, id, vertical }: PasswordVerifierProps) => {
	const { t } = useTranslation();
	const uniqueId = useId();

	const passwordVerifications: PasswordVerificationProps = useVerifyPassword(password || '');

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
					{passwordVerifications.map(({ isValid, limit, name }) => (
						<PasswordVerifierItem
							key={name}
							text={t(`${name}-label`, { limit })}
							isValid={isValid}
							aria-invalid={!isValid}
							vertical={!!vertical}
						/>
					))}
				</Box>
			</Box>
		</>
	);
};
