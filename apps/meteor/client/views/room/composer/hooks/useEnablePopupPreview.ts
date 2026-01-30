import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

export const useEnablePopupPreview = <T extends { _id: string; sort?: number }>(filter: unknown, popup?: ComposerPopupOption<T>) =>
	popup && !popup.preview && (popup?.triggerLength ? typeof filter === 'string' && popup.triggerLength - 1 < filter.length : true);
