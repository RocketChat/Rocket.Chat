import type { ILicenseTag } from './definition/ILicenseTag';

export const tags = new Set<ILicenseTag>();

export const addTag = (tag: ILicenseTag) => {
	// make sure to not add duplicated tag names
	for (const addedTag of tags) {
		if (addedTag.name.toLowerCase() === tag.name.toLowerCase()) {
			return;
		}
	}

	tags.add(tag);
};

export const replaceTags = (newTags: ILicenseTag[]) => {
	tags.clear();
	for (const tag of newTags) {
		addTag(tag);
	}
};

export const getTags = () => [...tags];
