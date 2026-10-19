import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { LabelProps } from '../Label';
import { Label } from '../Label';
import { FieldContext } from './Field';

export type FieldLabelProps = LabelProps;

function FieldLabel(props: FieldLabelProps) {
	const component = <Label rcx-field__label {...props} />;
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
