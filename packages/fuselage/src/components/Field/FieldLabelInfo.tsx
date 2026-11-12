import { FieldContext } from './Field.js';
import WithErrorWrapper from '../../helpers/WithErrorWrapper.js';
import type { LabelInfoProps } from '../Label/LabelInfo.js';
import { LabelInfo } from '../Label/LabelInfo.js';

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
