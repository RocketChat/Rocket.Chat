import { Callout, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type LicenseStatusProps = {
	isValidating: boolean;
	isValid: boolean;
	invalidMessage: string;
};

const LicenseStatus = ({ isValidating, isValid, invalidMessage }: LicenseStatusProps) => {
	const { t } = useTranslation();

	if (isValidating) {
		return (
			<Callout icon='reload' type='info' title={`${t('Validating_license')}...`}>
				<Skeleton width='x320' />
			</Callout>
		);
	}

	if (isValid) {
		return (
			<Callout type='success' title={t('Valid_license')}>
				{t('This_license_is_valid_and_ready_to_apply')}
			</Callout>
		);
	}

	return (
		<Callout type='danger' title={t('Invalid_license')}>
			{invalidMessage}
		</Callout>
	);
};

export default LicenseStatus;
