import { useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useDismissUserBannerMutation } from './useDismissUserBannerMutation';
import * as banners from '../../../lib/banners';

export const useUserBanners = () => {
	const user = useUser();

	const { t, i18n } = useTranslation();
	const { mutate: dismissUserBanner } = useDismissUserBannerMutation();

	useEffect(() => {
		if (!user?.banners || Object.keys(user.banners).length === 0) {
			return;
		}

		const firstBanner = Object.values(user.banners)
			.filter((b) => b.read !== true)
			.sort((a, b) => b.priority - a.priority)[0];

		if (!firstBanner) {
			return;
		}

		banners.open({
			id: firstBanner.id,
			title: i18n.exists(firstBanner.title) ? t(firstBanner.title) : firstBanner.title,
			text: i18n.exists(firstBanner.text)
				? t(firstBanner.text, {
						postProcess: 'sprintf',
						sprintf: firstBanner.textArguments,
					})
				: firstBanner.text,
			modifiers: firstBanner.modifiers,
			action() {
				if (firstBanner.link) {
					window.open(firstBanner.link, '_system');
				}
			},
			onClose() {
				dismissUserBanner({ id: firstBanner.id });
			},
		});
	}, [dismissUserBanner, i18n, t, user?.banners]);
};
