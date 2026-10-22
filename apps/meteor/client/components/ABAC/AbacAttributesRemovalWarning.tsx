import { Box, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useIsAbacEnforcementOn } from '../../views/room/hooks/useIsAbacEnforcementOn';

type AbacAttributesRemovalWarningProps = {
	roomNames?: string[];
};

const AbacAttributesRemovalWarning = ({ roomNames }: AbacAttributesRemovalWarningProps) => {
	const { t } = useTranslation();
	const enforcementOn = useIsAbacEnforcementOn();

	return (
		<Box marginBlockStart={16}>
			<Callout type='warning'>
				{roomNames
					? t('ABAC_Attributes_will_be_removed_from_rooms', { rooms: roomNames.join(', ') })
					: t('ABAC_Attributes_will_be_removed')}
				{enforcementOn &&
					` ${roomNames ? t('ABAC_Rooms_locked_until_attributes_reassigned') : t('ABAC_Room_locked_until_attributes_reassigned')}`}
			</Callout>
		</Box>
	);
};

export default AbacAttributesRemovalWarning;
