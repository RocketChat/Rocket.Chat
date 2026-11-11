import { Field, FieldDescription, FieldError, FieldHint, FieldLabel, FieldRow, InputBoxSkeleton } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react-webpack5';

import HorizontalWizardLayout from './HorizontalWizardLayout';
import HorizontalWizardLayoutAside from './HorizontalWizardLayoutAside';
import HorizontalWizardLayoutContent from './HorizontalWizardLayoutContent';
import HorizontalWizardLayoutDescription from './HorizontalWizardLayoutDescription';
import HorizontalWizardLayoutSubtitle from './HorizontalWizardLayoutSubtitle';
import HorizontalWizardLayoutTitle from './HorizontalWizardLayoutTitle';
import HorizontalWizardTextHighlight from './HorizontalWizardTextHighlight';
import ActionLink from '../../components/ActionLink/ActionLink';
import { Form, FormHeader, FormFooter, FormContainer, FormTitle, FormSubtitle } from '../../components/FormPageLayout';

export default {
	title: 'layouts/HorizontalWizardLayout',
	component: HorizontalWizardLayout,
} satisfies Meta<typeof HorizontalWizardLayout>;

export const Default: StoryFn<typeof HorizontalWizardLayout> = (props) => (
	<>
		<HorizontalWizardLayout {...props}>
			<HorizontalWizardLayoutAside>
				<HorizontalWizardLayoutTitle>
					Title <HorizontalWizardTextHighlight>highlight</HorizontalWizardTextHighlight>
				</HorizontalWizardLayoutTitle>
				<HorizontalWizardLayoutSubtitle>
					Subtitle <HorizontalWizardTextHighlight>highlight</HorizontalWizardTextHighlight>
				</HorizontalWizardLayoutSubtitle>
				<HorizontalWizardLayoutDescription>
					Description <ActionLink>highlight</ActionLink>
				</HorizontalWizardLayoutDescription>
			</HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutContent>
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
			</HorizontalWizardLayoutContent>
		</HorizontalWizardLayout>
	</>
);
Default.args = { forceDarkMode: false };

export const WithScroll: StoryFn<typeof HorizontalWizardLayout> = (props) => (
	<HorizontalWizardLayout {...props}>
		<HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutTitle>Title</HorizontalWizardLayoutTitle>
			<HorizontalWizardLayoutSubtitle>Subtitle</HorizontalWizardLayoutSubtitle>
			<HorizontalWizardLayoutDescription>
				Description <HorizontalWizardTextHighlight>highlight</HorizontalWizardTextHighlight>
			</HorizontalWizardLayoutDescription>
		</HorizontalWizardLayoutAside>
		<HorizontalWizardLayoutContent>
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
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
					<Field>
						<FieldLabel>Label</FieldLabel>
						<FieldDescription>Description</FieldDescription>
						<FieldRow>
							<InputBoxSkeleton />
						</FieldRow>
						<FieldRow>Error</FieldRow>
						<FieldHint>Hint</FieldHint>
					</Field>
				</FormContainer>
				<FormFooter>footer</FormFooter>
			</Form>
		</HorizontalWizardLayoutContent>
	</HorizontalWizardLayout>
);
WithScroll.args = { forceDarkMode: undefined };
