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
};

const RoomFormAttributeFields = ({ fields, remove, disabled = false, lockedLeadingCount = 0 }: RoomFormAttributeFieldsProps) => {
	const { t } = useTranslation();
	const isExternalAttributeStore = useIsExternalAttributeStore();

	const { data: attributeList, isLoading } = useAttributeList();

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
					<FieldLabel id={field.id} required={index === 0 || index < lockedLeadingCount}>
						{t('Attribute')}
					</FieldLabel>
					<RoomFormAttributeField
						labelId={field.id}
						attributeList={attributeList.attributes}
						required={index === 0 || index < lockedLeadingCount}
						onRemove={() => {
							remove(index);
						}}
						index={index}
						disabled={disabled}
						lockKey={index < lockedLeadingCount}
						removable={index >= lockedLeadingCount}
					/>
				</Field>
			))}
		</>
	);
};

export default RoomFormAttributeFields;
