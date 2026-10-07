import { Box, Icon, RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarAvatarSize, SidebarViewMode } from '../../../sidebar/hooks/useSidebarDisplayPreferences';
import { useSidebarDisplayPreferences } from '../../../sidebar/hooks/useSidebarDisplayPreferences';

const AVATAR_OPTIONS: { id: string; size?: SidebarAvatarSize; label: TranslationKey }[] = [
	{ id: 'avatar-off', label: 'Off' },
	{ id: 'avatar-small', size: 'small', label: 'Small' },
	{ id: 'avatar-medium', size: 'medium', label: 'Medium' },
	{ id: 'avatar-large', size: 'large', label: 'Large' },
];

export const useViewModeItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const { viewMode, displayAvatar, avatarSize, displayPreview, isPreviewAvailable } = useSidebarDisplayPreferences();

	const setViewMode = useCallback(
		(value: SidebarViewMode) => saveUserPreferences({ data: { sidebarViewMode: value } }),
		[saveUserPreferences],
	);

	const setAvatar = useCallback(
		(size?: SidebarAvatarSize) =>
			saveUserPreferences({ data: size ? { sidebarDisplayAvatar: true, sidebarAvatarSize: size } : { sidebarDisplayAvatar: false } }),
		[saveUserPreferences],
	);

	const handleChangeSidebarDisplayPreview = useCallback(
		() => saveUserPreferences({ data: { sidebarDisplayPreview: !displayPreview } }),
		[saveUserPreferences, displayPreview],
	);

	const currentAvatarOption = AVATAR_OPTIONS.find(({ size }) => (displayAvatar ? size === avatarSize : !size)) ?? AVATAR_OPTIONS[0];

	return [
		{
			id: 'extended',
			content: t('Extended'),
			icon: 'extended-view',
			onClick: () => setViewMode('extended'),
			addon: <RadioButton checked={viewMode === 'extended'} onChange={() => undefined} />,
		},
		{
			id: 'condensed',
			content: t('Condensed'),
			icon: 'condensed-view',
			onClick: () => setViewMode('condensed'),
			addon: <RadioButton checked={viewMode === 'condensed'} onChange={() => undefined} />,
		},
		{
			id: 'avatars',
			content: (
				<Box display='flex' flexDirection='column'>
					{t('Avatars')}
					<Box is='span' fontScale='c1' color='hint'>
						{t(currentAvatarOption.label)}
					</Box>
				</Box>
			),
			textValue: t('Avatars'),
			icon: 'user-rounded',
			submenu: AVATAR_OPTIONS.map(({ id, size, label }) => ({
				id,
				content: t(label),
				onClick: () => setAvatar(size),
				addon: currentAvatarOption.id === id ? <Icon name='check' size='x16' /> : undefined,
			})),
		},
		{
			id: 'message-preview',
			content: isPreviewAvailable ? (
				t('Message_preview')
			) : (
				<Box display='flex' flexDirection='column'>
					{t('Message_preview')}
					<Box is='span' fontScale='c1' color='hint' withTruncatedText>
						{t('Message_preview_unavailable')}
					</Box>
				</Box>
			),
			textValue: t('Message_preview'),
			tooltip: isPreviewAvailable ? undefined : t('Message_preview_unavailable_description'),
			icon: 'balloon-text',
			disabled: !isPreviewAvailable,
			onClick: handleChangeSidebarDisplayPreview,
			addon: <ToggleSwitch checked={displayPreview} disabled={!isPreviewAvailable} onChange={() => undefined} />,
		},
	];
};
