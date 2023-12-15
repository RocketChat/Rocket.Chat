import { Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { PasswordVerifierItem } from './PasswordVerifierItem';

type PasswordVerifierProps = {
	password: string | undefined;
	id?: string;
	inputStatus: 'unclicked' | 'focused' | 'blur';
};

type PasswordVerificationProps = {
	name: string;
	isValid: boolean;
	limit?: number;
}[];

/*
	When clicking a textbox for the first time, variant is 'default'.
	When the user starts typing, if it follows a policy, variant is 'success'.
	When the user clicks outside the textbox, if it has any errors, display those in 'error' variant.
*/
const checkVariant = (inputStatus: 'unclicked' | 'focused' | 'blur', isValid: boolean): 'default' | 'success' | 'error' => {
	if (inputStatus === 'unclicked') return 'default';
	if (isValid) return 'success';
	if (inputStatus === 'blur' && !isValid) return 'error';
	return 'default';
};

export const PasswordVerifier = ({ password, id, inputStatus }: PasswordVerifierProps) => {
	const { t } = useTranslation();
	const uniqueId = useUniqueId();

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
							variant={!password ? 'default' : checkVariant(inputStatus, isValid)}
							aria-invalid={!isValid}
						/>
					))}
				</Box>
			</Box>
		</>
	);
};
