import { CheckBox, Box } from '@rocket.chat/fuselage';
import { useFeaturePreview, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useGroupingListItems = (): GenericMenuItemProps[] => {
    const { t } = useTranslation();
    const secondSidebarEnabled = useFeaturePreview('secondarySidebar');

    const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
    const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
    const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

    const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

    const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
        useCallback(() => saveUserPreferences({ data: { [key]: value } }), [key, value]);

    const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
    const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
    const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);
	
    return [
        {
            id: 'unread',
            content: <Box mie="x24" flexGrow={1}>{t('Unread')}</Box>,
            icon: 'flag',
            addon: <CheckBox onChange={handleChangeShowUnread} checked={sidebarShowUnread} />,
        },
        !secondSidebarEnabled && {
            id: 'favorites',
            content: <Box mie="x24" flexGrow={1}>{t('Favorites')}</Box>,
            icon: 'star',
            addon: <CheckBox onChange={handleChangeShoFavorite} checked={sidebarShowFavorites} />,
        },
        {
            id: 'types',
            content: <Box mie="x24" flexGrow={1}>{t('Types')}</Box>,
            icon: 'group-by-type',
            addon: <CheckBox onChange={handleChangeGroupByType} checked={sidebarGroupByType} />,
        },
    ].filter(Boolean) as GenericMenuItemProps[];
};