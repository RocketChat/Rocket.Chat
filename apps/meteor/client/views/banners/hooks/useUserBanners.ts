import { useTranslation, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import * as banners from '../../../lib/banners';
import { useDismissUserBannerMutation } from './useDismissUserBannerMutation';

export const useUserBanners = () => {
	const user = useUser();

	const t = useTranslation();
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
			title: t.has(firstBanner.title) ? t(firstBanner.title) : firstBanner.title,
			text: t.has(firstBanner.text) ? t(firstBanner.text, firstBanner.textArguments) : firstBanner.text,
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
	}, [dismissUserBanner, t, user?.banners]);
};
