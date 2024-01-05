import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';

export const useCheckoutUrl = () => {
	const absoluteUrl = useAbsoluteUrl()('/links/manage-subscription');

	return (query?: Record<string, string>) => {
		const url = new URL(absoluteUrl);
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				url.searchParams.append(key, value.toString());
			});
		}
		return url.toString();
	};
};
