import type { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import { type ComponentPropsWithoutRef } from 'react';

import { useFieldFieldType } from '../FieldContext';
import HiddenLabel from './HiddenLabel';
import LabelFor from './LabelFor';
import ReferencedLabel from './ReferencedLabel';

export type FieldLabelProps = ComponentPropsWithoutRef<typeof FieldLabelComponent>;

const FieldLabel = (props: FieldLabelProps) => {
	const fieldType = useFieldFieldType();

	if (fieldType === 'wrappedByLabel') {
		return <HiddenLabel {...props} />;
	}
	if (fieldType === 'referencedByInput') {
		return <ReferencedLabel {...props} />;
	}
	// referencedByLabel
	return <LabelFor {...props} />;
};

export default FieldLabel;
