import type { ILicenseTag } from '@rocket.chat/core-typings';

import { type LicenseManager } from './license';

export function addTag(this: LicenseManager, tag: ILicenseTag) {
	// make sure to not add duplicated tag names
	for (const addedTag of this.tags) {
		if (addedTag.name.toLowerCase() === tag.name.toLowerCase()) {
			return;
		}
	}

	this.tags.add(tag);
}

export function replaceTags(this: LicenseManager, newTags: ILicenseTag[]) {
	this.tags.clear();
	for (const tag of newTags) {
		addTag.call(this, tag);
	}
}

export function getTags(this: LicenseManager) {
	return [...this.tags];
}
