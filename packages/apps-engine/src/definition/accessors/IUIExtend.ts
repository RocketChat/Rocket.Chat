import type { IUIActionButtonDescriptor } from '../ui';

/**
 * Registers the buttons an App adds to the Rocket.Chat UI.
 *
 * Call this from the App's `extendConfiguration`; it needs the
 * `ui.registerButtons` permission.
 */
export interface IUIExtend {
	registerButton(button: IUIActionButtonDescriptor): void;
}
