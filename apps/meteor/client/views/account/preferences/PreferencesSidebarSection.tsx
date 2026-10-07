import type { SelectOption } from '@rocket.chat/fuselage';
import { AccordionItem } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select, ToggleSwitch } from '@rocket.chat/fuselage-forms';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const PreferencesSidebarSection = () => {
	const { t } = useTranslation();
	const { control, watch } = useFormContext();
	const displayAvatar = watch('sidebarDisplayAvatar');
	const isPreviewAvailable = useSetting('Store_Last_Message', true);

	const viewModeOptions = useMemo(
		(): SelectOption[] => [
			['extended', t('Extended')],
			['condensed', t('Condensed')],
		],
		[t],
	);

	const avatarSizeOptions = useMemo(
		(): SelectOption[] => [
			['small', t('Small')],
			['medium', t('Medium')],
			['large', t('Large')],
		],
		[t],
	);

	return (
		<AccordionItem title={t('Sidebar')}>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Sidebar_list_mode')}</FieldLabel>
					<FieldRow>
						<Controller name='sidebarViewMode' control={control} render={({ field }) => <Select {...field} options={viewModeOptions} />} />
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Display_Avatars_Sidebar')}</FieldLabel>
						<Controller
							name='sidebarDisplayAvatar'
							control={control}
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Sidebar_avatar_size')}</FieldLabel>
					<FieldRow>
						<Controller
							name='sidebarAvatarSize'
							control={control}
							render={({ field }) => <Select {...field} options={avatarSizeOptions} disabled={!displayAvatar} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Display_Message_Preview_Sidebar')}</FieldLabel>
						<Controller
							name='sidebarDisplayPreview'
							control={control}
							render={({ field: { value, ...field } }) => (
								<ToggleSwitch {...field} checked={isPreviewAvailable && value} disabled={!isPreviewAvailable} />
							)}
						/>
					</FieldRow>
					<FieldHint>
						{isPreviewAvailable ? t('Display_Message_Preview_Sidebar_Description') : t('Message_preview_unavailable_description')}
					</FieldHint>
				</Field>
			</FieldGroup>
		</AccordionItem>
	);
};

export default PreferencesSidebarSection;
