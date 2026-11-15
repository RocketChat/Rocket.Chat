import { settings } from '../../settings';

export const isAdminHidingAllowed = (): boolean => settings.get<boolean>('Accounts_StatusVisibility_Admin_Enabled');

export const isUserHidingAllowed = (): boolean => isAdminHidingAllowed() && settings.get<boolean>('Accounts_StatusVisibility_Enabled');
