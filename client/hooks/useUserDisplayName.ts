import { IUser } from '../../definition/IUser';
import { useSetting } from '../contexts/SettingsContext';
import { getUserDisplayName } from '../lib/getUserDisplayName';

export const useUserDisplayName = ({ name, username }: Pick<IUser, 'name' | 'username'>): string | undefined => {
	const useRealName = useSetting('UI_Use_Real_Name');

	return getUserDisplayName(name, username, !!useRealName);
};
