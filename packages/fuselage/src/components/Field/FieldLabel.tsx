import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import { prependClassName } from '../../helpers/prependClassName.js';
import type { LabelProps } from '../Label/index.js';
import { Label } from '../Label/index.js';

export type FieldLabelProps = LabelProps;

function FieldLabel({ className, ...props }: FieldLabelProps) {
	const component = <Label {...props} className={prependClassName(className, 'rcx-field__label')} />;
	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldLabel.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
}

export default FieldLabel;
