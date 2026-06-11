import { Callout, Skeleton } from '@rocket.chat/fuselage';

type LicenseStatusProps = {
	isValidating: boolean;
	isValid: boolean;
	invalidMessage: string;
};

const LicenseStatus = ({ isValidating, isValid, invalidMessage }: LicenseStatusProps) => {
	if (isValidating) {
		return (
			<Callout icon='reload' type='info' title='Validating license...'>
				<Skeleton width='x320' />
			</Callout>
		);
	}

	if (isValid) {
		return (
			<Callout type='success' title='Valid license'>
				This license is valid and ready to apply.
			</Callout>
		);
	}

	return (
		<Callout type='danger' title='Invalid license'>
			{invalidMessage}
		</Callout>
	);
};

export default LicenseStatus;
