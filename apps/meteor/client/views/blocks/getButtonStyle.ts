import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';

export const getButtonStyle = (view: IUIKitSurface): { danger: boolean } | { primary: boolean } => {
	return view.submit?.style === 'danger' ? { danger: true } : { primary: true };
};
