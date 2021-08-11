import { Box } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import Field from './Field';
import ShortField from './ShortField';

type FieldProp = {
	short?: boolean;
	title: string;
	value: ReactNode;
};

const FieldsAttachment: FC<{ fields: FieldProp[] }> = ({ fields }): any => (
	<Box flexWrap='wrap' display='flex' mb='x4' mi='neg-x4'>
		{fields.map((field, index) =>
			field.short ? <ShortField {...field} key={index} /> : <Field {...field} key={index} />,
		)}
	</Box>
);

export default FieldsAttachment;
