import React, { FC } from 'react';
import { Box, BoxProps } from '@rocket.chat/fuselage';

type FieldProp = {
	short?: boolean;
	title: string;
	value: JSX.Element | string;
}

const Field: FC<BoxProps | FieldProp> = ({ title, value, ...props }) => <Box mb='x4' pi='x4' width='full' flexBasis={100} flexShrink={0} {...props}>
	<Box fontScale='p2' color='default'>{title}</Box>
	{value}
</Box>;

const ShortField: FC<FieldProp> = (props) => <Field {...props} flexGrow={1} width='50%' flexBasis={1}/>;

export type FieldsAttachmentProps = Array<FieldProp>;

export const FieldsAttachment: FC<{ fields: FieldsAttachmentProps }> = ({ fields }): any => <Box flexWrap='wrap' display='flex' mb='x4' mi='neg-x4'>{fields.map((field, index) => (field.short ? <ShortField {...field} key={index}/> : <Field {...field} key={index}/>))} </Box>;
