import { fetchFeatures } from '../../../client/lib/fetchFeatures';
import { queryClient } from '../../../../client/lib/queryClient';

const allModules = queryClient
	.fetchQuery({
		queryKey: ['ee.features'],
		queryFn: fetchFeatures,
	})
	.then((features) => new Set<string>(features))
	.catch((e) => {
		console.error('Error getting modules', e);
		return Promise.reject(e);
	});

export async function hasLicense(feature: string): Promise<boolean> {
	try {
		const features = await allModules;
		return features.has(feature);
	} catch (e) {
		return false;
	}
}
