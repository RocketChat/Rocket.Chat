import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { LabelProps } from '../Label';
import { FieldContext } from './Field';
import LabelBase from '../Label/LabelBase';

export type FieldLabelProps = LabelProps;

function FieldLabel(props: FieldLabelProps) {
	const component = <LabelBase {...props} field />;
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
