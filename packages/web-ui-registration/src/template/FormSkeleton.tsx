import { Field, InputBox, Skeleton } from '@rocket.chat/fuselage';
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
				<Field.Label>
					<Skeleton />
				</Field.Label>
				<Field.Description>
					<Skeleton />
				</Field.Description>
				<Field.Row>
					<InputBox.Skeleton />
				</Field.Row>
				<Field.Hint>
					<Skeleton />
				</Field.Hint>
			</Field>
			<Form.Footer>
				<Skeleton />
			</Form.Footer>
		</Form>
	);
};

export default FormSkeleton;
