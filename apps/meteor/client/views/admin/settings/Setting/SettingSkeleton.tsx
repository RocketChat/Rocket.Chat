import { Field, FieldLabel, FieldRow, Flex, InputBoxSkeleton, Skeleton } from '@rocket.chat/fuselage';

const SettingSkeleton = () => (
	<Field>
		<Flex.Item align='stretch'>
			<FieldLabel>
				<Skeleton width='25%' />
			</FieldLabel>
		</Flex.Item>
		<FieldRow>
			<InputBoxSkeleton />
		</FieldRow>
	</Field>
);

export default SettingSkeleton;
