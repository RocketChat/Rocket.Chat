import { CachedCollectionManager } from '../../../../app/ui-cached-collection';
import { callMethod } from '../../../../app/ui-utils/client/lib/callMethod';

const allModules = new Promise<Set<string>>((resolve, reject) => {
	CachedCollectionManager.onLogin(async () => {
		try {
			const features: string[] = await callMethod('license:getModules');
			resolve(new Set(features));
		} catch (e) {
			console.error('Error getting modules', e);
			reject(e);
		}
	});
});

const checkIsEnterprise = new Promise<boolean>((resolve, reject) => {
	CachedCollectionManager.onLogin(async () => {
		try {
			const enterprise: boolean = await callMethod('license:isEnterprise');
			resolve(enterprise);
		} catch (e) {
			console.error('Error checking if user has enterprise license', e);
			reject(e);
		}
	});
});

export async function hasLicense(feature: string): Promise<boolean> {
	try {
		const features = await allModules;
		return features.has(feature);
	} catch (e) {
		return false;
	}
}

export async function isEnterprise(): Promise<boolean> {
	try {
		const enabled = await checkIsEnterprise;
		return enabled;
	} catch (e) {
		return false;
	}
}
