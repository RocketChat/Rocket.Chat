import { FieldContext } from './Field';
import WithErrorWrapper from '../../helpers/WithErrorWrapper';
import type { LabelInfoProps } from '../Label/LabelInfo';
import { LabelInfo } from '../Label/LabelInfo';

export type FieldLabelInfoProps = LabelInfoProps;

const FieldLabelInfo = (props: FieldLabelInfoProps) => {
	const component = <LabelInfo {...props} />;

	if (process.env.NODE_ENV === 'development') {
		return (
			<WithErrorWrapper context={FieldContext} parentComponent='Field' componentName={FieldLabelInfo.name}>
				{component}
			</WithErrorWrapper>
		);
	}

	return component;
};

export default FieldLabelInfo;
