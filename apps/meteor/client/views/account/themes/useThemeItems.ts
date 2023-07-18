import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

export const useThemeItems = () => {
	const { data: license } = useIsEnterprise();

	const isEE = license?.isEnterprise;

	return [
		{
			id: 'light',
			title: 'Theme_light',
			description:
				'A good choice for well-lit environments. Light themes tend to be more accessible for individuals with visual impairments as they provide a high-contrast interface.',
		},
		{
			id: 'dark',
			title: 'Theme_dark',
			description:
				'Reduce the eye strain and fatigue in low-light or nighttime conditions by minimizing the amount of light emitted by the screen.',
		},
		{
			id: 'auto',
			title: 'Theme_match_system',
			description:
				'Automatically match the theme to your system preferences. This option is only available if your browser supports the prefers-color-scheme media query.',
		},
		{
			id: 'high-contrast',
			title: 'Theme_high_contrast',
			...(!isEE && { externalLink: 'https://www.rocket.chat/sales-contact', disabled: true }),
			description:
				'For enhanced accessibility, our high contrast theme (Enterprise feature) provides maximum visibility with bold colors and sharp contrasts.\nThis option is specifically designed to assist users with visual impairments, ensuring a comfortable and inclusive browsing experience.',
		},
	];
};
