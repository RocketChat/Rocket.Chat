import { Accordion, Box, Button, ButtonGroup, Field, RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useForm } from 'react-hook-form';

import Page from '../../../components/Page';

const THEMES = [
	{
		id: 'light',
		title: 'Theme_light',
		description:
			'A good choice for well-lit environments. Light themes tend to be more accessible for individuals with visual impairments as they provide a high-contrast interface.',
	},
	{
		id: 'dark',
		title: 'Theme_dark',
		description:
			'Reduce the eye strain and fatigue in low-light or nighttime conditions by minimizing the amount of light emitted by the screen.',
	},
	{
		id: 'auto',
		title: 'Theme_match_system',
		description:
			'Automatically match the theme to your system preferences. This option is only available if your browser supports the prefers-color-scheme media query.',
	},
	{
		id: 'high-contrast',
		title: 'Theme_high_contrast',
		description:
			'For enhanced accessibility, our high contrast theme (Enterprise feature) provides maximum visibility with bold colors and sharp contrasts. This option is specifically designed to assist users with visual impairments, ensuring a comfortable and inclusive browsing experience.',
	},
];
const ThemesPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

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
							{THEMES.map(({ id, title, description }, index) => (
								<Field key={id} pbe='x28' pbs={index === 0 ? undefined : 'x28'}>
									<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
										<Field.Label>{t.has(title) ? t(title) : title}</Field.Label>
										<Field.Row>
											<RadioButton {...register('themeAppearence')} value={id} />
										</Field.Row>
									</Box>
									<Field.Hint mbs='x12'>{t.has(description) ? t(description) : description}</Field.Hint>
								</Field>
							))}
						</Accordion.Item>
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ThemesPage;
