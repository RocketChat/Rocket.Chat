import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export type BackgroundEffectAssets = {
	runtimeUrl: string;
	modelUrl: string;
	presets: { id: string; url: string }[];
};

type Manifest = { runtime: string; model: string; presets: { id: string; path: string }[] };

const fetchBackgroundEffectAssets = async (baseUrl: string): Promise<BackgroundEffectAssets> => {
	const base = new URL(`${baseUrl.replace(/\/$/, '')}/`, window.location.href);
	const response = await fetch(new URL('manifest.json', base), { credentials: 'omit' });
	if (!response.ok) {
		throw new Error(`The background effects manifest answered ${response.status}`);
	}
	const manifest: Manifest = await response.json();
	return {
		runtimeUrl: new URL(manifest.runtime, base).href,
		modelUrl: new URL(manifest.model, base).href,
		presets: manifest.presets.map(({ id, path }) => ({ id, url: new URL(path, base).href })),
	};
};

// The file URLs carry their versions, so the manifest is fetched once per page.
const assetsQuery = (baseUrl: string) => ({
	queryKey: ['background-effect-assets', baseUrl] as const,
	queryFn: () => fetchBackgroundEffectAssets(baseUrl),
	staleTime: Infinity,
	retry: false,
});

/** Where the workspace serves the effects' files: `assets` once known, and `load` for code that cannot wait on a render. */
export const useBackgroundEffectAssets = (baseUrl: string) => {
	const queryClient = useQueryClient();
	const { data: assets } = useQuery(assetsQuery(baseUrl));
	const load = useCallback(() => queryClient.fetchQuery(assetsQuery(baseUrl)), [queryClient, baseUrl]);

	return { assets, load };
};
