import { Meteor } from 'meteor/meteor';

import { CachedCollectionManager } from '../../../../app/ui-cached-collection';

interface IPromiseParams {
	resolve: (resolve: boolean) => void;
	reject: (reason: any) => void;
}

const pendingFeatures = new Map<string, Set<IPromiseParams>>();
let validatedFeatures: Set<string>;
let rejectError: any;

export async function hasLicense(feature: string): Promise<boolean> {
	if (rejectError) {
		throw rejectError;
	}

	if (validatedFeatures) {
		return validatedFeatures.has(feature);
	}

	if (!pendingFeatures.has(feature)) {
		pendingFeatures.set(feature, new Set());
	}

	return new Promise<boolean>((resolve, reject) => {
		pendingFeatures.get(feature)?.add({ reject, resolve });
	});
}

function resolvePending(): void {
	pendingFeatures.forEach((promises, feature) => {
		const value = validatedFeatures.has(feature);
		promises.forEach(({ resolve }) => resolve(value));
		pendingFeatures.delete(feature);
	});
}

function rejectPending(): void {
	pendingFeatures.forEach((promises, feature) => {
		promises.forEach(({ reject }) => reject(rejectError));
		pendingFeatures.delete(feature);
	});
}

CachedCollectionManager.onLogin(() => {
	Meteor.call('license:getModules', (error: any, features: string[] = []) => {
		if (error) {
			rejectError = error;
			return rejectPending();
		}

		validatedFeatures = new Set(features);

		resolvePending();
	});
});
