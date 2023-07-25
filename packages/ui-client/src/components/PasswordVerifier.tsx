import { Box, Icon } from '@rocket.chat/fuselage';
import { useVerifyPassword } from '@rocket.chat/ui-contexts';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type PasswordVerifierProps = {
	password: string;
	passwordVerifications: ReturnType<typeof useVerifyPassword>;
};

type validationMessage = {
	policy: string;
	isValid: boolean;
	limit?: number;
};

export const PasswordVerifier = ({ password, passwordVerifications }: PasswordVerifierProps) => {
	const { t } = useTranslation();

	const handleRenderPasswordVerification = (passwordVerifications: ReturnType<typeof useVerifyPassword>) => {
		if (!passwordVerifications) return null;

		const verifications: ReactElement[] = [];

		passwordVerifications.forEach((element: validationMessage) => {
			verifications.push(
				<Box
						display='flex'
						flexBasis='50%'
						alignItems='center'
						mbe='x8'
						fontScale='c1'
						key={element.policy}
						color={element.isValid && password.length !== 0 ? 'status-font-on-success' : 'status-font-on-danger'}
					>
						<Icon
							name={element.isValid && password.length !== 0 ? 'success-circle' : 'error-circle'}
							color={element.isValid && password.length !== 0 ? 'status-font-on-success' : 'status-font-on-danger'}
							size='x16'
							mie='x4'
						/>
						{t(`${element.policy}-label`, { element.limit })}
					</Box>,
			)

			return verifications;
		});
	}

	return (
		<Box display='flex' flexDirection='column' mbs='x8'>
			<Box mbe='x8' fontScale='c2'>
				{t('Password_must_have')}
			</Box>
			<Box display='flex' flexWrap='wrap'>
				{handleRenderPasswordVerification(passwordVerifications)}
			</Box>
		</Box>
	);
};
