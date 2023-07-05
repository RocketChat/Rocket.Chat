import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type validationMessage = {
	error: boolean;
	message?: Record<
		string,
		{
			isValid: boolean;
			limit?: number | undefined;
		}
	>;
};

type PasswordVerifierProps = {
	password: string;
	passwordVerifications: validationMessage[];
};

export const PasswordVerifier = ({ password, passwordVerifications }: PasswordVerifierProps) => {
	const { t } = useTranslation();

	const handleRenderPasswordVerification = (passwordVerifications: validationMessage[]) => {
		const verifications = [];

		if (!passwordVerifications) return null;

		for (const verification in passwordVerifications) {
			if (passwordVerifications[verification]) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const { isValid, limit } = passwordVerifications[verification].message!;

				verifications.push(
					<Box
						display='flex'
						flexBasis='50%'
						alignItems='center'
						mbe='x8'
						fontScale='c1'
						key={verification}
						color={isValid && password.length !== 0 ? 'status-font-on-success' : 'status-font-on-danger'}
					>
						<Icon
							name={isValid && password.length !== 0 ? 'success-circle' : 'error-circle'}
							color={isValid && password.length !== 0 ? 'status-font-on-success' : 'status-font-on-danger'}
							size='x16'
							mie='x4'
						/>
						{t(`${verification}-label`, { limit })}
					</Box>,
				);
			}
		}

		return verifications;
	};

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
