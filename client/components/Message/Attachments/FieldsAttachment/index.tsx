import { Box } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import Field from './Field';
import ShortField from './ShortField';

type FieldsAttachmentProp = {
	short?: boolean;
	title: ReactNode;
	value: ReactNode;
};

const FieldsAttachment: FC<{ fields: FieldsAttachmentProp[] }> = ({ fields }): any => (
	<Box flexWrap='wrap' display='flex' mb='x4' mi='neg-x4'>
		{fields.map((field, index) => (field.short ? <ShortField {...field} key={index} /> : <Field {...field} key={index} />))}
	</Box>
);

export default FieldsAttachment;
