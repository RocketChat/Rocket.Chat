import type { SecurityCategory, SecurityCategoryTagType } from '@rocket.chat/core-typings';
import { DOMParser } from '@xmldom/xmldom';
import type { Element } from '@xmldom/xmldom';

import { SpifError } from '../errors';
import { categoryKey } from './types';
import type {
	CategoryRequirement,
	Marking,
	MarkingLocation,
	MarkingPhrase,
	Markings,
	SecurityCategoryDefinition,
	SecurityCategoryTagDefinition,
	SecurityCategoryTagSetDefinition,
	SecurityClassificationDefinition,
	SecurityPolicy,
} from './types';

export const SPIF_NAMESPACE = 'http://www.xmlspif.org/spif';
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';

type CategoryReference = { tagSetRef: string; tagType: SecurityCategoryTagType; lacv?: string };
type RequirementReference = { operation: CategoryRequirement['operation']; references: CategoryReference[] };

const childElements = (parent: Element, localName: string): Element[] =>
	Array.from(parent.childNodes).filter(
		(node): node is Element =>
			node.nodeType === node.ELEMENT_NODE && (node as Element).namespaceURI === SPIF_NAMESPACE && (node as Element).localName === localName,
	);

const childElement = (parent: Element, localName: string): Element | undefined => childElements(parent, localName)[0];

const requiredAttribute = (element: Element, name: string): string => {
	const value = element.getAttribute(name);
	if (value === null || value.trim() === '') {
		throw new SpifError(`<${element.localName}> is missing the "${name}" attribute`);
	}
	return value.trim();
};

const optionalAttribute = (element: Element, name: string): string | undefined => element.getAttribute(name)?.trim() || undefined;

const booleanAttribute = (element: Element, name: string): boolean => optionalAttribute(element, name) === 'true';

const integerAttribute = (element: Element, name: string): number => {
	const raw = requiredAttribute(element, name);
	if (!/^\d+$/.test(raw)) {
		throw new SpifError(`<${element.localName}> has a non-integer "${name}": ${raw}`);
	}
	return Number(raw);
};

const languageOf = (element: Element): string => element.getAttributeNS(XML_NAMESPACE, 'lang') ?? element.getAttribute('xml:lang') ?? '';

const parseTagType = (element: Element): SecurityCategoryTagType => {
	const tagType = requiredAttribute(element, 'tagType');
	switch (tagType) {
		case 'restrictive':
		case 'permissive':
			return tagType;
		case 'tagType7':
			return 'informative';
		case 'enumerated': {
			const enumType = requiredAttribute(element, 'enumType');
			if (enumType === 'restrictive') return 'enumeratedRestrictive';
			if (enumType === 'permissive') return 'enumeratedPermissive';
			throw new SpifError(`Unsupported enumType: ${enumType}`);
		}
		default:
			throw new SpifError(`Unsupported tagType: ${tagType}`);
	}
};

const markingCodes: Record<string, (phrase: MarkingPhrase, locations: Set<MarkingLocation>) => void> = {
	pageTop: (_, locations) => locations.add('pageTop'),
	pageBottom: (_, locations) => locations.add('pageBottom'),
	pageTopBottom: (_, locations) => locations.add('pageTop').add('pageBottom'),
	documentStart: (_, locations) => locations.add('documentStart'),
	documentEnd: (_, locations) => locations.add('documentEnd'),
	noMarkingDisplay: (phrase) => {
		phrase.noMarkingDisplay = true;
	},
	noNameDisplay: (phrase) => {
		phrase.noNameDisplay = true;
	},
	suppressClassName: (phrase) => {
		phrase.suppressClassName = true;
	},
	replacePolicy: (phrase) => {
		phrase.replacePolicy = true;
	},
};

const parseMarkings = (holder: Element): Markings => {
	const markings: Markings = new Map();
	const markingFor = (lang: string): Marking => {
		const existing = markings.get(lang);
		if (existing) return existing;
		const created: Marking = { phrases: [] };
		markings.set(lang, created);
		return created;
	};

	for (const data of childElements(holder, 'markingData')) {
		const phrase: MarkingPhrase = {
			phrase: data.getAttribute('phrase') ?? undefined,
			noMarkingDisplay: false,
			noNameDisplay: false,
			suppressClassName: false,
			replacePolicy: false,
		};
		const locations = new Set<MarkingLocation>();
		for (const code of childElements(data, 'code')) {
			const name = code.textContent?.trim() ?? '';
			const apply = markingCodes[name];
			if (!apply) {
				throw new SpifError(`Unknown marking code: ${name}`);
			}
			apply(phrase, locations);
		}
		if (locations.size) {
			phrase.locations = [...locations];
		}
		markingFor(languageOf(data)).phrases.push(phrase);
	}

	for (const qualifierGroup of childElements(holder, 'markingQualifier')) {
		for (const qualifier of childElements(qualifierGroup, 'qualifier')) {
			const text = qualifier.getAttribute('markingQualifier');
			const code = qualifier.getAttribute('qualifierCode');
			if (text === null || (code !== 'prefix' && code !== 'suffix' && code !== 'separator')) {
				continue;
			}
			markingFor(languageOf(qualifier))[code] = text;
		}
	}

	return markings;
};

const parseCategoryReference = (element: Element): CategoryReference => ({
	tagSetRef: requiredAttribute(element, 'tagSetRef'),
	tagType: parseTagType(element),
	lacv: booleanAttribute(element, 'all') ? undefined : optionalAttribute(element, 'lacv'),
});

const parseRequirementReferences = (holder: Element): RequirementReference[] =>
	childElements(holder, 'requiredCategory').map((required) => {
		const operation = requiredAttribute(required, 'operation');
		if (operation !== 'onlyOne' && operation !== 'oneOrMore' && operation !== 'all') {
			throw new SpifError(`Unsupported requiredCategory operation: ${operation}`);
		}
		return { operation, references: childElements(required, 'categoryGroup').map(parseCategoryReference) };
	});

/**
 * Parses an Open XML SPIF into the policy the engine evaluates labels against.
 * Throws a {@link SpifError} on anything it cannot interpret, so a broken policy never loads half-applied.
 */
export const parseSpif = (xml: string): SecurityPolicy => {
	let document;
	try {
		document = new DOMParser({
			onError: (level, message) => {
				if (level !== 'warning') throw new SpifError(message);
			},
		}).parseFromString(xml, 'text/xml');
	} catch (error) {
		throw error instanceof SpifError ? error : new SpifError(error instanceof Error ? error.message : String(error));
	}

	if (document.doctype) {
		throw new SpifError('SPIF documents may not declare a DOCTYPE');
	}

	const root = document.documentElement;
	if (root?.namespaceURI !== SPIF_NAMESPACE || root.localName !== 'SPIF') {
		throw new SpifError(`Root element must be <SPIF> in the ${SPIF_NAMESPACE} namespace`);
	}

	const policyIdElement = childElement(root, 'securityPolicyId');
	if (!policyIdElement) {
		throw new SpifError('SPIF has no <securityPolicyId>');
	}

	const classifications: SecurityClassificationDefinition[] = [];
	const classificationsByLacv = new Map<number, SecurityClassificationDefinition>();
	const classificationsByName = new Map<string, SecurityClassificationDefinition>();
	const pendingRequirements: Array<{ target: CategoryRequirement[]; references: RequirementReference[] }> = [];
	const pendingExclusions: Array<{ target: SecurityCategory[]; references: CategoryReference[] }> = [];

	for (const element of childElements(childElement(root, 'securityClassifications') ?? root, 'securityClassification')) {
		const classification: SecurityClassificationDefinition = {
			name: requiredAttribute(element, 'name'),
			lacv: integerAttribute(element, 'lacv'),
			hierarchy: integerAttribute(element, 'hierarchy'),
			color: optionalAttribute(element, 'color'),
			obsolete: booleanAttribute(element, 'obsolete'),
			requiredCategories: [],
			markings: parseMarkings(element),
		};
		if (classificationsByLacv.has(classification.lacv) || classificationsByName.has(classification.name)) {
			throw new SpifError(`Duplicate securityClassification: ${classification.name} (${classification.lacv})`);
		}
		classifications.push(classification);
		classificationsByLacv.set(classification.lacv, classification);
		classificationsByName.set(classification.name, classification);
		pendingRequirements.push({ target: classification.requiredCategories, references: parseRequirementReferences(element) });
	}

	if (!classifications.length) {
		throw new SpifError('SPIF declares no securityClassification');
	}

	const tagSets: SecurityCategoryTagSetDefinition[] = [];
	const tagSetsByRef = new Map<string, SecurityCategoryTagSetDefinition>();
	const categoriesByKey = new Map<string, SecurityCategoryDefinition>();

	for (const tagSetElement of childElements(childElement(root, 'securityCategoryTagSets') ?? root, 'securityCategoryTagSet')) {
		const tagSet: SecurityCategoryTagSetDefinition = {
			name: requiredAttribute(tagSetElement, 'name'),
			id: requiredAttribute(tagSetElement, 'id'),
			tags: [],
		};
		if (tagSets.some(({ id, name }) => id === tagSet.id || name === tagSet.name)) {
			throw new SpifError(`Duplicate securityCategoryTagSet: ${tagSet.name} (${tagSet.id})`);
		}

		for (const tagElement of childElements(tagSetElement, 'securityCategoryTag')) {
			const tag: SecurityCategoryTagDefinition = {
				name: requiredAttribute(tagElement, 'name'),
				tagType: parseTagType(tagElement),
				singleSelection: booleanAttribute(tagElement, 'singleSelection'),
				categories: [],
				markings: parseMarkings(tagElement),
			};

			for (const categoryElement of childElements(tagElement, 'tagCategory')) {
				const category: SecurityCategoryDefinition = {
					tagSetId: tagSet.id,
					tagType: tag.tagType,
					lacv: requiredAttribute(categoryElement, 'lacv'),
					name: requiredAttribute(categoryElement, 'name'),
					tagName: tag.name,
					tagSetName: tagSet.name,
					obsolete: booleanAttribute(categoryElement, 'obsolete'),
					excludedClassifications: childElements(categoryElement, 'excludedClass').map((excluded) => {
						const name = excluded.textContent?.trim() ?? '';
						const classification = classificationsByName.get(name);
						if (!classification) {
							throw new SpifError(`excludedClass references an unknown classification: ${name}`);
						}
						return classification.lacv;
					}),
					excludedCategories: [],
					requiredCategories: [],
					markings: parseMarkings(categoryElement),
				};
				if (new Set(category.excludedClassifications).size !== category.excludedClassifications.length) {
					throw new SpifError(`Duplicate excludedClass in ${tagSet.name}: ${category.name}`);
				}
				const key = categoryKey(category);
				if (categoriesByKey.has(key)) {
					throw new SpifError(`Duplicate tagCategory in ${tagSet.name}: ${category.tagType} ${category.lacv}`);
				}
				categoriesByKey.set(key, category);
				tag.categories.push(category);
				pendingRequirements.push({ target: category.requiredCategories, references: parseRequirementReferences(categoryElement) });
				pendingExclusions.push({
					target: category.excludedCategories,
					references: childElements(categoryElement, 'excludedCategory').map(parseCategoryReference),
				});
			}
			tagSet.tags.push(tag);
		}

		tagSets.push(tagSet);
		tagSetsByRef.set(tagSet.id, tagSet);
		tagSetsByRef.set(tagSet.name, tagSet);
	}

	const resolve = ({ tagSetRef, tagType, lacv }: CategoryReference): SecurityCategory[] => {
		const tagSet = tagSetsByRef.get(tagSetRef);
		if (!tagSet) {
			throw new SpifError(`Reference to an unknown securityCategoryTagSet: ${tagSetRef}`);
		}
		if (lacv === undefined) {
			return tagSet.tags
				.filter((tag) => tag.tagType === tagType)
				.flatMap(({ categories }) => categories.map(({ tagSetId, lacv }) => ({ tagSetId, tagType, lacv })));
		}
		const reference = { tagSetId: tagSet.id, tagType, lacv };
		if (!categoriesByKey.has(categoryKey(reference))) {
			throw new SpifError(`Reference to an unknown tagCategory in ${tagSet.name}: ${tagType} ${lacv}`);
		}
		return [reference];
	};

	for (const { target, references } of pendingRequirements) {
		target.push(...references.map(({ operation, references }) => ({ operation, categoryGroups: references.map(resolve) })));
	}
	for (const { target, references } of pendingExclusions) {
		target.push(...references.flatMap(resolve));
	}

	return {
		id: requiredAttribute(policyIdElement, 'id'),
		name: requiredAttribute(policyIdElement, 'name'),
		version: optionalAttribute(root, 'version'),
		classifications,
		tagSets,
		markings: parseMarkings(root),
		classificationsByLacv,
		categoriesByKey,
	};
};
