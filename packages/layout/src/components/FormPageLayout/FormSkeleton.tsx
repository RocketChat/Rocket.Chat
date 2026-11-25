import { Field, FieldLabel, FieldRow, FieldHint, FieldDescription, Skeleton, InputBoxSkeleton } from '@rocket.chat/fuselage';

import Form from './Form.js';
import FormContainer from './FormContainer.js';
import FormFooter from './FormFooter.js';
import FormHeader from './FormHeader.js';
import FormTitle from './FormTitle.js';

const FormSkeleton = () => (
	<Form aria-busy>
		<FormHeader>
			<FormTitle>
				<Skeleton />
			</FormTitle>
		</FormHeader>
		<FormContainer></FormContainer>
		<Field>
			<FieldLabel>
				<Skeleton />
			</FieldLabel>
			<FieldDescription>
				<Skeleton />
			</FieldDescription>
			<FieldRow>
				<InputBoxSkeleton />
			</FieldRow>
			<FieldHint>
				<Skeleton />
			</FieldHint>
		</Field>
		<FormFooter>
			<Skeleton />
		</FormFooter>
	</Form>
);

export default FormSkeleton;
