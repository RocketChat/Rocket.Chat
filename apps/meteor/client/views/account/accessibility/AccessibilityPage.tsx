import { Accordion, Box, Button, ButtonGroup, Field, FieldGroup, RadioButton, Select, Tag } from '@rocket.chat/fuselage';
import { useLocalStorage, useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { FontSize } from '@rocket.chat/rest-typings';
import { useSetModal, useTranslation, useToastMessageDispatch, useUserPreference, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import HighContrastUpsellModal from './HighContrastUpsellModal';
import { fontSizes } from './fontSizes';
import { useAdjustableFontSize } from './hooks/useAdsjustableFontSize';
import { themeItems as themes } from './themeItems';

const AccessibilityPage = () => {
	const t = useTranslation();
	const setModal = useSetModal();

	const dispatchToastMessage = useToastMessageDispatch();
	const { data: license } = useIsEnterprise();

	const fontSizeId = useUniqueId();
	const [fontSize, setFontSize] = useAdjustableFontSize();

	const themePreference = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const [, setPrevTheme] = useLocalStorage('prevTheme', themePreference);

	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const {
		formState: { isDirty, dirtyFields },
		handleSubmit,
		control,
		reset,
	} = useForm({
		defaultValues: { themeAppearence: themePreference, fontSize },
	});

	const handleSave = async ({ themeAppearence, fontSize }: { themeAppearence: ThemePreference; fontSize: FontSize }) => {
		try {
			await setUserPreferences({ data: { themeAppearence, fontSize } });
			// dirtyFields.themeAppearence && (await setUserPreferences({ data: { themeAppearence, fontSize } }));
			// dirtyFields.fontSize && (await setUserPreferences({ data: { fontSize } }));
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			if (dirtyFields.themeAppearence) {
				setPrevTheme(themePreference);
			}
			if (dirtyFields.fontSize) {
				setFontSize(fontSize);
			}
			reset({ themeAppearence, fontSize });
		}
	};

	return (
		<Page>
			<Page.Header title={t('Accessibility_and_Appearance')} />
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' mb={40} mi={36}>
					<Box fontScale='p1' mbe={24}>
						<Box pb={16}>{t('Accessibility_activation')}</Box>
					</Box>
					<Accordion>
						<Accordion.Item defaultExpanded={true} title={t('Theme')}>
							{themes.map(({ id, title, description, ...item }, index) => {
								const communityDisabled = 'isEEOnly' in item && item.isEEOnly && !license?.isEnterprise;

								return (
									<Field key={id} pbe={themes.length - 1 ? undefined : 'x28'} pbs={index === 0 ? undefined : 'x28'}>
										<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
											<Field.Label display='flex' alignItems='center' fontScale='p2b' htmlFor={id}>
												{t.has(title) ? t(title) : title}
												{communityDisabled && (
													<Box is='span' mis={8}>
														<Tag variant='featured'>{t('Enterprise')}</Tag>
													</Box>
												)}
											</Field.Label>
											<Field.Row>
												<Controller
													control={control}
													name='themeAppearence'
													render={({ field: { onChange, value, ref } }) => {
														if (communityDisabled) {
															return (
																<RadioButton
																	id={id}
																	ref={ref}
																	onChange={() => setModal(<HighContrastUpsellModal onClose={() => setModal(null)} />)}
																	checked={false}
																/>
															);
														}
														return <RadioButton id={id} ref={ref} onChange={() => onChange(id)} checked={value === id} />;
													}}
												/>
											</Field.Row>
										</Box>
										<Field.Hint mbs={12} style={{ whiteSpace: 'break-spaces' }}>
											{t.has(description) ? t(description) : description}
										</Field.Hint>
									</Field>
								);
							})}
						</Accordion.Item>
						<Accordion.Item title={t('Adjustable_layout')}>
							<FieldGroup>
								<Field>
									<Field.Label htmlFor={fontSizeId} fontScale='p2b' mbe={12}>
										{t('Font_size')}
									</Field.Label>
									<Field.Row>
										<Controller
											control={control}
											name='fontSize'
											render={({ field: { onChange, value } }) => (
												<Select id={fontSizeId} value={value} onChange={onChange} options={fontSizes} />
											)}
										/>
									</Field.Row>
									<Field.Description mb={12}>{t('Adjustable_font_size_description')}</Field.Description>
								</Field>
							</FieldGroup>
						</Accordion.Item>
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset({ themeAppearence: themePreference, fontSize })}>{t('Cancel')}</Button>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default AccessibilityPage;
