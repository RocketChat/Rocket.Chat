import type { SecurityCategory, SecurityCategoryTagType } from '@rocket.chat/core-typings';

export type MarkingLocation = 'pageTop' | 'pageBottom' | 'documentStart' | 'documentEnd';

/**
 * One SPIF `markingData` element.
 */
export type MarkingPhrase = {
	/** Absent when the SPIF names no location: the phrase then applies everywhere */
	locations?: MarkingLocation[];
	phrase?: string;
	noMarkingDisplay: boolean;
	noNameDisplay: boolean;
	suppressClassName: boolean;
	replacePolicy: boolean;
};

/**
 * Everything a SPIF says about rendering one element in one language.
 */
export type Marking = {
	phrases: MarkingPhrase[];
	prefix?: string;
	suffix?: string;
	separator?: string;
};

/**
 * Markings keyed by `xml:lang`; the empty key holds the untagged ones.
 */
export type Markings = Map<string, Marking>;

/**
 * A SPIF `requiredCategory`: `operation` says how many of its `categoryGroup`s the label must meet.
 * A group is met by any one of its categories; a group naming no `lacv` holds every category of its tag set and type.
 */
export type CategoryRequirement = {
	operation: 'onlyOne' | 'oneOrMore' | 'all';
	categoryGroups: SecurityCategory[][];
};

export type SecurityClassificationDefinition = {
	name: string;
	lacv: number;
	hierarchy: number;
	color?: string;
	obsolete: boolean;
	requiredCategories: CategoryRequirement[];
	markings: Markings;
};

export type SecurityCategoryDefinition = SecurityCategory & {
	name: string;
	tagName: string;
	tagSetName: string;
	obsolete: boolean;
	/** `lacv`s of the classifications this category may not be combined with */
	excludedClassifications: number[];
	excludedCategories: SecurityCategory[];
	requiredCategories: CategoryRequirement[];
	markings: Markings;
};

export type SecurityCategoryTagDefinition = {
	name: string;
	tagType: SecurityCategoryTagType;
	singleSelection: boolean;
	categories: SecurityCategoryDefinition[];
	markings: Markings;
};

export type SecurityCategoryTagSetDefinition = {
	name: string;
	id: string;
	tags: SecurityCategoryTagDefinition[];
};

/**
 * A parsed SPIF. Arrays keep the SPIF's declaration order, which is also marking order.
 */
export type SecurityPolicy = {
	id: string;
	name: string;
	version?: string;
	classifications: SecurityClassificationDefinition[];
	tagSets: SecurityCategoryTagSetDefinition[];
	markings: Markings;
	classificationsByLacv: Map<number, SecurityClassificationDefinition>;
	/** Keyed by {@link categoryKey} */
	categoriesByKey: Map<string, SecurityCategoryDefinition>;
};

export const categoryKey = ({ tagSetId, tagType, lacv }: SecurityCategory): string => `${tagSetId}|${tagType}|${lacv}`;
