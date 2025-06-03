import { css } from '@rocket.chat/css-in-js';
import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldDescription,
	Accordion,
	AccordionItem,
	Box,
	Button,
	ButtonGroup,
	Field,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	RadioButton,
	Select,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation, useToastMessageDispatch, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { fontSizes } from './fontSizes';
import type { AccessibilityPreferencesData } from './hooks/useAcessibilityPreferencesValues';
import { useAccessiblityPreferencesValues } from './hooks/useAcessibilityPreferencesValues';
import { useCreateFontStyleElement } from './hooks/useCreateFontStyleElement';
import { themeItems as themes } from './themeItems';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { getDirtyFields } from '../../../lib/getDirtyFields';

const AccessibilityPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const preferencesValues = useAccessiblityPreferencesValues();

	const createFontStyleElement = useCreateFontStyleElement();
	const displayRolesEnabled = useSetting('UI_DisplayRoles');

	const timeFormatOptions = useMemo(
		(): SelectOption[] => [
			['0', t('Default')],
			['1', t('12_Hour')],
			['2', t('24_Hour')],
		],
		[t],
	);

	const pageFormId = useId();
	const fontSizeId = useId();
	const mentionsWithSymbolId = useId();
	const clockModeId = useId();
	const hideUsernamesId = useId();
	const hideRolesId = useId();
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

	const setUserPreferencesEndpoint = useEndpoint('POST', '/v1/users.setPreferences');

	const setPreferencesAction = useMutation({
		mutationFn: setUserPreferencesEndpoint,
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Preferences_saved') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		onSettled: (_data, _error, { data: { fontSize } }) => {
			reset(currentData);
			dirtyFields.fontSize && fontSize && createFontStyleElement(fontSize);
		},
	});

	const handleSaveData = (formData: AccessibilityPreferencesData) => {
		const data = getDirtyFields(formData, dirtyFields);
		setPreferencesAction.mutateAsync({ data });
	};

	return (
		<Page>
			<PageHeader title={t('Accessibility_and_Appearance')} />
			<PageScrollableContentWithShadow>
				<Box is='form' id={pageFormId} onSubmit={handleSubmit(handleSaveData)} maxWidth='x600' w='full' alignSelf='center' mb={40} mi={36}>
					<Box fontScale='p1' mbe={24}>
						<Box pb={16} is='p'>
							{t('Accessibility_activation')}
						</Box>
						<p id={linkListId}>{t('Learn_more_about_accessibility')}</p>
						<ul aria-labelledby={linkListId}>
							<li>
								<ExternalLink to='https://go.rocket.chat/i/accessibility-statement'>{t('Accessibility_statement')}</ExternalLink>
							</li>
							<li>
								<ExternalLink to='https://go.rocket.chat/i/glossary'>{t('Glossary_of_simplified_terms')}</ExternalLink>
							</li>
							<li>
								<ExternalLink to='https://go.rocket.chat/i/accessibility-and-appearance'>
									{t('Accessibility_feature_documentation')}
								</ExternalLink>
							</li>
						</ul>
					</Box>
					<Accordion>
						<AccordionItem defaultExpanded={true} title={t('Theme')}>
							{themes.map(({ id, title, description }, index) => {
								return (
									<Field key={id} pbe={themes.length - 1 ? undefined : 'x28'} pbs={index === 0 ? undefined : 'x28'}>
										<FieldRow>
											<FieldLabel display='flex' alignItems='center' htmlFor={id}>
												{t(title)}
											</FieldLabel>
											<Controller
												control={control}
												name='themeAppearence'
												render={({ field: { onChange, value, ref } }) => (
													<RadioButton id={id} ref={ref} onChange={() => onChange(id)} checked={value === id} />
												)}
											/>
										</FieldRow>
										<FieldHint mbs={12} style={{ whiteSpace: 'break-spaces' }}>
											{t(description)}
										</FieldHint>
									</Field>
								);
							})}
						</AccordionItem>
						<AccordionItem title={t('Adjustable_layout')}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor={fontSizeId} mbe={12}>
										{t('Font_size')}
									</FieldLabel>
									<FieldRow>
										<Controller
											control={control}
											name='fontSize'
											render={({ field: { onChange, value } }) => (
												<Select id={fontSizeId} value={value} onChange={onChange} options={fontSizes} />
											)}
										/>
									</FieldRow>
									<FieldDescription mb={12}>{t('Adjustable_font_size_description')}</FieldDescription>
								</Field>
								<Field>
									<FieldRow>
										<FieldLabel htmlFor={mentionsWithSymbolId}>{t('Mentions_with_@_symbol')}</FieldLabel>
										<Controller
											control={control}
											name='mentionsWithSymbol'
											render={({ field: { onChange, value, ref } }) => (
												<ToggleSwitch id={mentionsWithSymbolId} ref={ref} checked={value} onChange={onChange} />
											)}
										/>
									</FieldRow>
									<FieldDescription
										className={css`
											white-space: break-spaces;
										`}
										mb={12}
									>
										{t('Mentions_with_@_symbol_description')}
									</FieldDescription>
								</Field>
								<Field>
									<FieldLabel htmlFor={clockModeId}>{t('Message_TimeFormat')}</FieldLabel>
									<FieldRow>
										<Controller
											name='clockMode'
											control={control}
											render={({ field: { value, onChange } }) => (
												<Select id={clockModeId} value={`${value}`} onChange={onChange} options={timeFormatOptions} />
											)}
										/>
									</FieldRow>
								</Field>
								<Field>
									<FieldRow>
										<FieldLabel htmlFor={hideUsernamesId}>{t('Show_usernames')}</FieldLabel>
										<Controller
											name='hideUsernames'
											control={control}
											render={({ field: { value, onChange, ref } }) => (
												<ToggleSwitch
													id={hideUsernamesId}
													ref={ref}
													checked={!value}
													onChange={(e) => onChange(!(e.target as HTMLInputElement).checked)}
												/>
											)}
										/>
									</FieldRow>
									<FieldDescription>{t('Show_or_hide_the_username_of_message_authors')}</FieldDescription>
								</Field>
								{displayRolesEnabled && (
									<Field>
										<FieldRow>
											<FieldLabel htmlFor={hideRolesId}>{t('Show_roles')}</FieldLabel>
											<Controller
												name='hideRoles'
												control={control}
												render={({ field: { value, onChange, ref } }) => (
													<ToggleSwitch
														id={hideRolesId}
														ref={ref}
														checked={!value}
														onChange={(e) => onChange(!(e.target as HTMLInputElement).checked)}
													/>
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

export default AccessibilityPage;
