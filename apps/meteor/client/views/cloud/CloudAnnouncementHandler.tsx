import type { IBanner, UiKit } from '@rocket.chat/core-typings';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { exhaustiveCheck } from '../../../lib/utils/exhaustiveCheck';
import { useUiKitActionManager } from '../../uikit/hooks/useUiKitActionManager';

type CloudAnnouncementHandlerProps = Pick<IBanner, 'dictionary' | 'surface' | 'view'>;

const CloudAnnouncementHandler = ({ dictionary = {}, surface, view }: CloudAnnouncementHandlerProps) => {
	const { i18n } = useTranslation();

	useEffect(() => {
		const appNs = `app-cloud-announcements-core`;
		if (!dictionary) {
			return;
		}

		for (const [language, translations] of Object.entries(dictionary)) {
			i18n.addResources(language, appNs, translations);
		}
	}, [i18n, dictionary]);

	const actionManager = useUiKitActionManager();

	const viewRef = useRef({ ...view, appId: view.appId || 'cloud-announcements-core' });
	viewRef.current = { ...view, appId: view.appId || 'cloud-announcements-core' };

	useEffect(() => {
		switch (surface) {
			case 'modal': {
				// TODO fixme
				const modalView = viewRef.current as unknown as UiKit.ModalView;

				actionManager.openView('modal', modalView);

				return () => {
					actionManager.disposeView(modalView.id);
				};
			}

			case 'banner': {
				const bannerView = viewRef.current as UiKit.BannerView;

				actionManager.openView('banner', { ...bannerView });

				return () => {
					actionManager.disposeView(bannerView.viewId);
				};
			}

			default:
				exhaustiveCheck(surface);
		}
	}, [actionManager, surface]);

	return null;
};

export default CloudAnnouncementHandler;
