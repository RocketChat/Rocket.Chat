import { useQuery } from '@tanstack/react-query';

export const useAsyncImage = (src: string | undefined) => {
	return useQuery({
		queryKey: ['async-image', src],
		queryFn: () =>
			new Promise<string>((resolve, reject) => {
				if (!src) {
					reject(new Error('No src provided'));
					return;
				}

				const image = new Image();
				image.addEventListener('load', () => {
					resolve(image.src);
				});
				image.addEventListener('error', (e) => {
					reject(e.error);
				});
				image.src = src;
			}),
		enabled: Boolean(src),
		retry: false,
	});
};
