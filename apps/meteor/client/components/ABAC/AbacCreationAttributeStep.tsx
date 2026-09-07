import { Box, Button, Callout } from '@rocket.chat/fuselage';
import { FieldGroup } from '@rocket.chat/fuselage-forms';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeFields from '../../views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields';

export const MAX_ATTRIBUTE_ROWS = 10;

export type AbacCreationAttributeStepProps = {
	fields: { id: string }[];
	append: () => void;
	remove: (index: number) => void;
	/** Workspace-required attribute keys, pre-filled and not removable (ABAC-P4 M2). */
	requiredAttributeKeys: string[];
	/** A PDP refusal from the previous attempt to leave this step. */
	pdpDenial?: string;
	/** Why this user cannot assign attributes at all — see `useAbacAssignabilityBlock`. */
	blockedReason?: string;
};

/**
 * The room-attributes step of a creation flow (ABAC-P4 M2), shared by the channel and team modals
 * so the two cannot drift.
 *
 * When the user has nothing they could assign, the picker is replaced by the reason. It used to be
 * rendered anyway, which left them staring at a search box with no options and no explanation
 * (ABAC-P4 QA).
 */
const AbacCreationAttributeStep = ({
	fields,
	append,
	remove,
	requiredAttributeKeys,
	pdpDenial,
	blockedReason,
}: AbacCreationAttributeStepProps) => {
	const { t } = useTranslation();

	return (
		<FieldGroup marginBlockEnd={24}>
			<Box is='h5' fontScale='h5' color='titles-labels'>
				{t('ABAC_Room_attributes_section')}
			</Box>
			{blockedReason && <Callout type='danger'>{blockedReason}</Callout>}
			{!blockedReason && (
				<>
					{pdpDenial && <Callout type='danger'>{pdpDenial}</Callout>}
					<RoomFormAttributeFields fields={fields} remove={remove} lockedLeadingCount={requiredAttributeKeys.length} assignableOnly />
					{/* The button is not a `Field`, so `FieldGroup` does not space it off the row above it. */}
					<Button width='full' marginBlockStart={8} disabled={fields.length >= MAX_ATTRIBUTE_ROWS} onClick={append}>
						{t('ABAC_Add_Attribute')}
					</Button>
				</>
			)}
		</FieldGroup>
	);
};

export default AbacCreationAttributeStep;
