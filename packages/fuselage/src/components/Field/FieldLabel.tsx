import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import { prependClassName } from '../../helpers/prependClassName';
import type { LabelProps } from '../Label';
import { Label } from '../Label';
import { FieldContext } from './Field';

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
