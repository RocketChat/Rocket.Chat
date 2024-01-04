import { Field, FieldLabel, FieldRow, FieldHint, FieldDescription, InputBox, Skeleton } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import type { ReactElement } from 'react';

const FormSkeleton = (): ReactElement => {
	return (
		<Form aria-busy>
			<Form.Header>
				<Form.Title>
					<Skeleton />
				</Form.Title>
			</Form.Header>
			<Form.Container></Form.Container>
			<Field>
				<FieldLabel>
					<Skeleton />
				</FieldLabel>
				<FieldDescription>
					<Skeleton />
				</FieldDescription>
				<FieldRow>
					<InputBox.Skeleton />
				</FieldRow>
				<FieldHint>
					<Skeleton />
				</FieldHint>
			</Field>
			<Form.Footer>
				<Skeleton />
			</Form.Footer>
		</Form>
	);
};

export default FormSkeleton;
