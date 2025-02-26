import { Box } from '@rocket.chat/fuselage';
import { Trans } from 'react-i18next';

const AirGappedRestrictionWarning = ({ isRestricted, remainingDays }: { isRestricted: boolean; remainingDays: number }) => {
	if (isRestricted) {
		return (
			<Trans i18nKey='Airgapped_workspace_restriction'>
				This air-gapped workspace is in read-only mode.{' '}
				<Box fontScale='p2' is='span'>
					Connect it to the internet or upgrade to a premium plan to restore full functionality.
				</Box>
			</Trans>
		);
	}

	return (
		<Trans i18nKey='Airgapped_workspace_warning' values={{ remainingDays }}>
			This air-gapped workspace will enter read-only mode in {remainingDays} days.{' '}
			<Box fontScale='p2' is='span'>
				Connect it to the internet or upgrade to a premium plan to prevent this.
			</Box>
		</Trans>
	);
};

export default AirGappedRestrictionWarning;
