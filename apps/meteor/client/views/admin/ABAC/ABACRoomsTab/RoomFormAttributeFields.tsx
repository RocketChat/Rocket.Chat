import { Box, Field, FieldLabel, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeField from './RoomFormAttributeField';
import { useAttributeList } from '../hooks/useAttributeList';
import { useIsExternalAttributeStore } from '../hooks/useIsExternalAttributeStore';

type RoomFormAttributeFieldsProps = {
	fields: { id: string }[];
	remove: (index: number) => void;
	disabled?: boolean;
};

const RoomFormAttributeFields = ({ fields, remove, disabled = false }: RoomFormAttributeFieldsProps) => {
	const { t } = useTranslation();
	const isExternalAttributeStore = useIsExternalAttributeStore();

	const { data: attributeList, isLoading } = useAttributeList();

	if (isLoading || !attributeList) {
		return <InputBoxSkeleton />;
	}

	return (
		<>
			{isExternalAttributeStore && (
				<Box mbe={8} color='annotation' fontSize='p2'>
					{t('ABAC_Picker_External_Store_Helper')}
				</Box>
			)}
			{fields.map((field, index) => (
				<Field key={field.id}>
					<FieldLabel id={field.id} required={index === 0}>
						{t('Attribute')}
					</FieldLabel>
					<RoomFormAttributeField
						labelId={field.id}
						attributeList={attributeList.attributes}
						required={index === 0}
						onRemove={() => {
							remove(index);
						}}
						index={index}
						disabled={disabled}
					/>
				</Field>
			))}
		</>
	);
};

export default RoomFormAttributeFields;
