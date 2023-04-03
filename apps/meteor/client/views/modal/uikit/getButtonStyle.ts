import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';

// TODO: Move to fuselage-ui-kit
export const getButtonStyle = (view: IUIKitSurface): { danger: boolean } | { primary: boolean } => {
	return view.submit?.style === 'danger' ? { danger: true } : { primary: true };
};
