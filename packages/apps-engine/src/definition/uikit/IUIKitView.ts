import type { IUIKitSurface } from './IUIKitSurface';
import { UIKitSurfaceType } from './IUIKitSurface';

export import UIKitViewType = UIKitSurfaceType;
/**
 * A view an App renders out of UIKit blocks.
 *
 * @deprecated kept for backwards compatibility; use {@link IUIKitSurface}.
 */
export type IUIKitView = IUIKitSurface;
