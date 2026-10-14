import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';

const AI_CENTER_PERMISSIONS = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

export const useCanManageAISettings = (): boolean => useAtLeastOnePermission(AI_CENTER_PERMISSIONS);
