import { Field, FieldLabel, FieldRow, FieldHint, FieldDescription, Skeleton, InputBoxSkeleton } from '@rocket.chat/fuselage';

import Form from './Form';
import FormContainer from './FormContainer';
import FormFooter from './FormFooter';
import FormHeader from './FormHeader';
import FormTitle from './FormTitle';

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
