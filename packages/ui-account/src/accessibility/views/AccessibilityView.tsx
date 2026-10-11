import { VisuallyHidden } from '@react-aria/visually-hidden';
import { css } from '@rocket.chat/css-in-js';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Accordion, AccordionItem, Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	FieldDescription,
	Field,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	RadioButton,
	Select,
	ToggleSwitch,
} from '@rocket.chat/fuselage-forms';
import {
	ExternalLink,
	Page,
	PageHeader,
	PageScrollableContentWithShadow,
	PageFooter,
	getDirtyFields,
	links,
	useCreateFontStyleElement,
} from '@rocket.chat/ui-client';
import { useTranslation, useLocationHash } from '@rocket.chat/ui-contexts';
import { useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { fontSizes } from './fontSizes';
import { themeItems as themes } from './themeItems';
import type { AccessibilityPreferencesData, AccessibilityPreferencesViewModel } from '../logic/useAccessibilityPreferences';

export type AccessibilityViewProps = {
	vm: AccessibilityPreferencesViewModel;
};

const AccessibilityView = ({ vm: { values: preferencesValues, displayRolesEnabled, save } }: AccessibilityViewProps) => {
	const t = useTranslation();

	const createFontStyleElement = useCreateFontStyleElement();
	const shouldExpand = useLocationHash().length > 1;

	const timeFormatOptions = useMemo(
		(): SelectOption[] => [
			['0', t('Default')],
			['1', t('12_Hour')],
			['2', t('24_Hour')],
		],
		[t],
	);

	const pageFormId = useId();
	const linkListId = useId();

	const {
		formState: { isDirty, dirtyFields, isSubmitting },
		handleSubmit,
		control,
		reset,
		watch,
	} = useForm({
		defaultValues: preferencesValues,
	});

	const currentData = watch();

	const handleSaveData = async (formData: AccessibilityPreferencesData) => {
		const changes = getDirtyFields(formData, dirtyFields);
		await save(changes);
		reset(currentData);
		if (changes.fontSize) {
			createFontStyleElement(changes.fontSize);
		}
	};

	return (
		<Page>
			<PageHeader title={t('Accessibility_and_Appearance')} />
			<PageScrollableContentWithShadow>
				<Box
					is='form'
					id={pageFormId}
					onSubmit={handleSubmit(handleSaveData)}
					maxWidth='x600'
					width='full'
					alignSelf='center'
					marginBlock={40}
					marginInline={36}
				>
					<Box fontScale='p1' marginBlockEnd={24}>
						<Box paddingBlock={16} is='p'>
							{t('Accessibility_activation')}
						</Box>
						<p id={linkListId}>{t('Learn_more_about_accessibility')}</p>
						<ul aria-labelledby={linkListId}>
							<li>
								<ExternalLink to={links.go.accessibilityStatement}>{t('Accessibility_statement')}</ExternalLink>
							</li>
							<li>
								<ExternalLink to={links.go.glossary}>{t('Glossary_of_simplified_terms')}</ExternalLink>
							</li>
							<li>
								<ExternalLink to={links.go.accessibilityAndAppearance}>{t('Accessibility_feature_documentation')}</ExternalLink>
							</li>
						</ul>
					</Box>
					<Accordion>
						<AccordionItem defaultExpanded={true} title={t('Theme')}>
							{themes.map(({ id, title, description }, index) => {
								return (
									<Field
										key={id}
										paddingBlockEnd={themes.length - 1 ? undefined : 'x28'}
										paddingBlockStart={index === 0 ? undefined : 'x28'}
									>
										<FieldRow>
											<FieldLabel display='flex' alignItems='center'>
												{t(title)}
											</FieldLabel>
											<Controller
												control={control}
												name='themeAppearence'
												render={({ field: { value, onChange, ...field } }) => (
													<RadioButton id={id} {...field} onChange={() => onChange(id)} checked={value === id} />
												)}
											/>
										</FieldRow>
										<FieldHint marginBlockStart={12} style={{ whiteSpace: 'break-spaces' }}>
											{t(description)}
										</FieldHint>
									</Field>
								);
							})}
						</AccordionItem>
						<AccordionItem defaultExpanded={shouldExpand} title={t('Adjustable_layout')}>
							<FieldGroup>
								<VisuallyHidden>
									<legend>{t('Adjustable_layout')}</legend>
								</VisuallyHidden>
								<Field>
									<FieldLabel marginBlockEnd={12}>{t('Font_size')}</FieldLabel>
									<FieldRow>
										<Controller control={control} name='fontSize' render={({ field }) => <Select {...field} options={fontSizes(t)} />} />
									</FieldRow>
									<FieldDescription marginBlock={12}>{t('Adjustable_font_size_description')}</FieldDescription>
								</Field>
								<Field>
									<FieldRow>
										<FieldLabel>{t('Mentions_with_@_symbol')}</FieldLabel>
										<Controller
											control={control}
											name='mentionsWithSymbol'
											render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
										/>
									</FieldRow>
									<FieldDescription
										className={css`
											white-space: break-spaces;
										`}
										marginBlock={12}
									>
										{t('Mentions_with_@_symbol_description')}
									</FieldDescription>
								</Field>
								<Field id='clockMode'>
									<FieldLabel>{t('Message_TimeFormat')}</FieldLabel>
									<FieldRow>
										<Controller
											name='clockMode'
											control={control}
											render={({ field: { value, ...field } }) => <Select {...field} value={`${value}`} options={timeFormatOptions} />}
										/>
									</FieldRow>
								</Field>
								<Field id='hideUsernames'>
									<FieldRow>
										<FieldLabel>{t('Show_usernames')}</FieldLabel>
										<Controller
											name='hideUsernames'
											control={control}
											render={({ field: { value, onChange, ...field } }) => (
												<ToggleSwitch {...field} checked={!value} onChange={(e) => onChange(!(e.target as HTMLInputElement).checked)} />
											)}
										/>
									</FieldRow>
									<FieldDescription>{t('Show_or_hide_the_username_of_message_authors')}</FieldDescription>
								</Field>
								{displayRolesEnabled && (
									<Field id='hideRoles'>
										<FieldRow>
											<FieldLabel>{t('Show_roles')}</FieldLabel>
											<Controller
												name='hideRoles'
												control={control}
												render={({ field: { value, onChange, ...field } }) => (
													<ToggleSwitch {...field} checked={!value} onChange={(e) => onChange(!(e.target as HTMLInputElement).checked)} />
												)}
											/>
										</FieldRow>
										<FieldDescription>{t('Show_or_hide_the_user_roles_of_message_authors')}</FieldDescription>
									</Field>
								)}
							</FieldGroup>
						</AccordionItem>
					</Accordion>
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset(preferencesValues)}>{t('Cancel')}</Button>
					<Button primary disabled={!isDirty} loading={isSubmitting} form={pageFormId} type='submit'>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AccessibilityView;
