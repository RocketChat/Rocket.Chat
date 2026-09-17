import { Field, FieldLabel, FieldRow, FieldHint, FieldDescription, Skeleton, InputBoxSkeleton } from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter, FormHeader, FormTitle } from '@rocket.chat/layout';

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
