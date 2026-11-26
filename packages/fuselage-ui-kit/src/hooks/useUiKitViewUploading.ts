import { useSyncExternalStore } from 'react';

import type { UiKitViewState } from '../utils/createUiKitViewState';

const subscribeToNothing = () => () => undefined;

/** Whether a `file_input` of the view still has uploads in flight, so the surface can hold its submit. */
export const useUiKitViewUploading = (viewState: UiKitViewState | undefined): boolean =>
	useSyncExternalStore(viewState?.subscribe ?? subscribeToNothing, () => viewState?.isUploading() ?? false);
