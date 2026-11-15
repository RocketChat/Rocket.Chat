import { Field, FieldDescription, FieldError, FieldHint, FieldLabel, FieldRow, InputBoxSkeleton } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react-webpack5';

import VerticalWizardLayout from './VerticalWizardLayout';
import VerticalWizardLayoutFooter from './VerticalWizardLayoutFooter';
import VerticalWizardLayoutForm from './VerticalWizardLayoutForm';
import VerticalWizardLayoutTitle from './VerticalWizardLayoutTitle';
import { Form, FormContainer, FormFooter, FormHeader, FormSubtitle, FormTitle } from '../../components/FormPageLayout';

export default {
	title: 'layouts/VerticalWizardLayout',
	component: VerticalWizardLayout,
} satisfies Meta<typeof VerticalWizardLayout>;

export const Default: StoryFn<typeof VerticalWizardLayout> = () => (
	<VerticalWizardLayout>
		<VerticalWizardLayoutTitle>Title</VerticalWizardLayoutTitle>
		<VerticalWizardLayoutForm>
			<Form onSubmit={console.log}>
				<FormHeader>
					<FormTitle>Title</FormTitle>
					<FormSubtitle>Subtitle</FormSubtitle>
				</FormHeader>
				<FormContainer>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>
				</FormContainer>
				<FormFooter>footer</FormFooter>
			</Form>
		</VerticalWizardLayoutForm>
		<VerticalWizardLayoutFooter>New here? Create account</VerticalWizardLayoutFooter>
	</VerticalWizardLayout>
);

export const WithScroll: StoryFn<typeof VerticalWizardLayout> = () => (
	<VerticalWizardLayout>
		<VerticalWizardLayoutTitle>Title</VerticalWizardLayoutTitle>
		<VerticalWizardLayoutForm>
			<Form onSubmit={console.log}>
				<FormHeader>
					<FormTitle>Title</FormTitle>
					<FormSubtitle>Subtitle</FormSubtitle>
				</FormHeader>
				<FormContainer>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>{' '}
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldError>Error</FieldError>
						<FieldHint>Hint</FieldHint>
					</Field>
				</FormContainer>
				<FormFooter>footer</FormFooter>
			</Form>
		</VerticalWizardLayoutForm>
		<VerticalWizardLayoutFooter>New here? Create account</VerticalWizardLayoutFooter>
	</VerticalWizardLayout>
);
