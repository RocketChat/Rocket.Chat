import { Field, FieldLabel } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeField from './RoomFormAttributeField';

type RoomFormAttributeFieldsProps = {
	fields: { id: string }[];
	remove: (index: number) => void;
};

const RoomFormAttributeFields = ({ fields, remove }: RoomFormAttributeFieldsProps) => {
	const { t } = useTranslation();

	return fields.map((field, index) => (
		<Field key={field.id}>
			<FieldLabel id={field.id} required={index === 0}>
				{t('Attribute')}
			</FieldLabel>
			<RoomFormAttributeField
				labelId={field.id}
				required={index === 0}
				onRemove={() => {
					remove(index);
				}}
				index={index}
			/>
		</Field>
	));
};

export default RoomFormAttributeFields;
