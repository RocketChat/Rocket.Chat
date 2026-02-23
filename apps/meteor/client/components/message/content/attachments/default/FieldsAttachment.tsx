import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Field from './Field';
import ShortField from './ShortField';

type FieldsAttachmentProps = {
	fields: {
		short?: boolean;
		title: ReactNode;
		value: ReactNode;
	}[];
};

const FieldsAttachment = ({ fields }: FieldsAttachmentProps) => (
	<Box flexWrap='wrap' display='flex' mb={4} mi={-4}>
		{fields.map((field, index) => (field.short ? <ShortField key={`${index}-${String(field.title)}`} {...field} /> : <Field key={`${index}-${String(field.title)}`} {...field} />))}
	</Box>
);

export default FieldsAttachment;
