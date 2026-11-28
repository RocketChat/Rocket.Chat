import { Box } from '@rocket.chat/fuselage';
import { Trans } from 'react-i18next';

export type AirGappedRestrictionWarningProps = { isRestricted: boolean; remainingDays: number };

const AirGappedRestrictionWarning = ({ isRestricted, remainingDays }: AirGappedRestrictionWarningProps) => {
	if (isRestricted) {
		return (
			<Trans
				i18nKey='Airgapped_workspace_restriction'
				components={{ detail: <Box fontScale='p2' is='span' /> }}
			/>
		);
	}

	return (
		<Trans
			i18nKey='Airgapped_workspace_warning'
			values={{ remainingDays }}
			components={{ detail: <Box fontScale='p2' is='span' /> }}
		/>
	);
};

export default AirGappedRestrictionWarning;
