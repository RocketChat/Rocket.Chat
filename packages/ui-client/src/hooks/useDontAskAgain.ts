import { useUserPreference } from '@rocket.chat/ui-contexts';

export type DontAskAgainList = Array<{ action: string; label: string }>;

export const useDontAskAgain = (action: string): boolean => {
	const dontAskAgainList = useUserPreference<DontAskAgainList>('dontAskAgainList');
	const shouldNotAskAgain = dontAskAgainList?.some(({ action: currentAction }) => action === currentAction) ?? false;

	return shouldNotAskAgain;
};
