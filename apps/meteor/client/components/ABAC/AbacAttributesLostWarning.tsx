import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useIsABACAvailable } from '../../views/admin/ABAC/hooks/useIsABACAvailable';

export type AbacAttributesLostWarningProps = {
	room: Pick<IRoom, 'abacAttributes'>;
};

/**
 * Warns that an operation will discard the room's ABAC attributes (ABAC-P4 M4).
 *
 * Converting a channel or private group to a team, converting a team back to a channel, and moving
 * a channel into a team all drop the room's attributes, leaving the result locked until someone
 * reassigns them. That is expensive to discover afterwards, so it is said before the operation.
 *
 * The brief also lists "converting a discussion to a channel", but no such conversion exists in the
 * product — the only convert endpoints are `channels.convertToTeam`, `groups.convertToTeam` and
 * `teams.convertToChannel` — so there is nothing to warn on there.
 *
 * Renders nothing when the room has no attributes to lose, so it can be dropped into any of those
 * confirmations unconditionally.
 */
const AbacAttributesLostWarning = ({ room }: AbacAttributesLostWarningProps) => {
	const { t } = useTranslation();
	const isAbacAvailable = useIsABACAvailable();

	if (!isAbacAvailable || !room.abacAttributes?.length) {
		return null;
	}

	return (
		<Box marginBlockStart={12} color='danger'>
			{t('ABAC_Attributes_will_be_lost')}
		</Box>
	);
};

export default AbacAttributesLostWarning;
