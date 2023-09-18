import type { ILicenseTag } from './definition/ILicenseTag';

const tags = new Set<ILicenseTag>();

export const addTag = (tag: ILicenseTag) => {
	// make sure to not add duplicated tag names
	for (const addedTag of tags) {
		if (addedTag.name.toLowerCase() === tag.name.toLowerCase()) {
			return;
		}
	}

	tags.add(tag);
};

export const addTags = (tags: ILicenseTag[]) => {
	for (const tag of tags) {
		addTag(tag);
	}
};

export const getTags = () => [...tags];
