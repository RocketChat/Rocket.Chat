import { Box, Field, FieldLabel, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeField from './RoomFormAttributeField';
import { useAttributeList } from '../hooks/useAttributeList';
import { useIsExternalAttributeStore } from '../hooks/useIsExternalAttributeStore';

export type RoomFormAttributeFieldsProps = {
	fields: { id: string }[];
	remove: (index: number) => void;
	disabled?: boolean;
	/**
	 * Number of leading rows whose attribute key is fixed and which cannot be removed — the
	 * workspace-required attributes, pre-filled by the creation flow (ABAC-P4 M2).
	 */
	lockedLeadingCount?: number;
	/**
	 * Offer only the attributes this user could be granted (ABAC-P4/D12). Set by the room-facing
	 * surfaces — creating a room, and a room's own Edit channel panel. The administrative Rooms tab
	 * leaves it off: an operator assigns attributes on behalf of a room, not out of their own
	 * entitlements, and D11 keeps that behaviour as it was.
	 */
	assignableOnly?: boolean;
	/**
	 * Whether the room must keep at least one attribute, which makes the first row required and not
	 * removable. True while enforcement is on — every room has to stay ABAC-managed. With
	 * enforcement off, clearing the last attribute is how a room stops being ABAC-managed, so the
	 * row has to be removable (ABAC-P4 QA).
	 */
	requireAtLeastOne?: boolean;
};

const RoomFormAttributeFields = ({
	fields,
	remove,
	disabled = false,
	lockedLeadingCount = 0,
	assignableOnly = false,
	requireAtLeastOne = true,
}: RoomFormAttributeFieldsProps) => {
	const { t } = useTranslation();
	const isExternalAttributeStore = useIsExternalAttributeStore();

	const { data: attributeList, isLoading } = useAttributeList({ assignableOnly });

	if (isLoading || !attributeList) {
		return <InputBoxSkeleton />;
	}

	return (
		<>
			{isExternalAttributeStore && (
				<Box marginBlockEnd={8} color='annotation' fontSize='p2'>
					{t('ABAC_Picker_External_Store_Helper')}
				</Box>
			)}
			{fields.map((field, index) => (
				<Field key={field.id}>
					<FieldLabel id={field.id} required={index < lockedLeadingCount || (index === 0 && requireAtLeastOne)}>
						{t('Attribute')}
					</FieldLabel>
					<RoomFormAttributeField
						labelId={field.id}
						attributeList={attributeList.attributes}
						required={index < lockedLeadingCount || (index === 0 && requireAtLeastOne)}
						onRemove={() => {
							remove(index);
						}}
						index={index}
						disabled={disabled}
						lockKey={index < lockedLeadingCount}
						removable={index >= lockedLeadingCount && !(index === 0 && requireAtLeastOne)}
					/>
				</Field>
			))}
		</>
	);
};

export default RoomFormAttributeFields;
