import { Box } from '@rocket.chat/fuselage';
import type { FC, ReactNode } from 'react';
import React from 'react';

import Field from './Field';
import ShortField from './ShortField';

type FieldsAttachmentProps = {
	short?: boolean;
	title: ReactNode;
	value: ReactNode;
};

const FieldsAttachment: FC<{ fields: FieldsAttachmentProps[] }> = ({ fields }): any => (
	<Box flexWrap='wrap' display='flex' mb={4} mi={-4}>
		{fields.map((field, index) => (field.short ? <ShortField {...field} key={index} /> : <Field {...field} key={index} />))}
	</Box>
);

export default FieldsAttachment;
