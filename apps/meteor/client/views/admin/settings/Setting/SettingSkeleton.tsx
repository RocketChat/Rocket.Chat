import { css } from '@rocket.chat/css-in-js';
import { Field, FieldLabel, FieldRow, InputBoxSkeleton, Skeleton, useStyle } from '@rocket.chat/fuselage';

// The label spans the whole field, so the skeleton's width is a share of it
const fullWidthLabelStyle = css`
	& > :first-child {
		align-self: stretch;
	}
`;

const SettingSkeleton = () => {
	const fullWidthLabelClassName = useStyle(fullWidthLabelStyle);

	return (
		<Field className={fullWidthLabelClassName}>
			<FieldLabel>
				<Skeleton width='25%' />
			</FieldLabel>
			<FieldRow>
				<InputBoxSkeleton />
			</FieldRow>
		</Field>
	);
};

export default SettingSkeleton;
