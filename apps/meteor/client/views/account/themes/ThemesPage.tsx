import { Accordion, Box, Button, ButtonGroup, Field, RadioButton, Tag } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import { useThemeItems } from './useThemeItems';

const ThemesPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const themes = useThemeItems();
	const themePreference = useUserPreference<'light' | 'dark' | 'auto' | 'high-contrast'>('themeAppearence') || 'auto';
	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const {
		formState: { isDirty },
		handleSubmit,
		register,
		reset,
	} = useForm({
		defaultValues: { themeAppearence: themePreference },
	});

	const handleSave = async ({ themeAppearence }: { themeAppearence: 'auto' | 'light' | 'dark' | 'high-contrast' }) => {
		try {
			await setUserPreferences({ data: { themeAppearence } });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset({ themeAppearence });
		}
	};

	return (
		<Page>
			<Page.Header title={t('Themes')}>
				<ButtonGroup>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' mb='x40' mi='x36'>
					<Box fontScale='p1' mbe='x24'>
						<Box pb='x16'>Choose the theme that best suits your preferences and enjoy a personalized browsing experience.</Box>
						<Box pb='x16'>Here you have the power to transform the platform's appearance to match your style and needs.</Box>
					</Box>
					<Accordion>
						<Accordion.Item defaultExpanded={true} title={t('Themes')}>
							{themes.map(({ id, title, description, ...item }, index) => {
								const disabled = 'disabled' in item && item.disabled;
								const externalLink = 'externalLink' in item && item.externalLink;

								return (
									<Field key={id} pbe={themes.length - 1 ? undefined : 'x28'} pbs={index === 0 ? undefined : 'x28'}>
										<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
											<Field.Label display='flex' alignItems='center'>
												{t.has(title) ? t(title) : title}
												{disabled && (
													<Box is='span' mis='x8'>
														<Tag variant='featured'>{t('Enterprise')}</Tag>
													</Box>
												)}
											</Field.Label>
											<Field.Row>
												<RadioButton {...register('themeAppearence')} value={id} disabled={disabled} />
											</Field.Row>
										</Box>
										<Field.Hint mbs='x12' style={{ whiteSpace: 'break-spaces' }}>
											{t.has(description) ? t(description) : description}
											<Box mbs='x12'>{externalLink && <ExternalLink to={externalLink}>{t('Talk_to_an_expert')}</ExternalLink>}</Box>
										</Field.Hint>
									</Field>
								);
							})}
						</Accordion.Item>
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ThemesPage;
