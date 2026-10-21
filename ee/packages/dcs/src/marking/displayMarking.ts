import type { ISecurityLabel, SecurityLabelDisplayMarking } from '@rocket.chat/core-typings';

import { readableTextColor } from './colors';
import { categoryKey } from '../policy/types';
import type { Marking, MarkingLocation, MarkingPhrase, Markings, SecurityCategoryDefinition, SecurityPolicy } from '../policy/types';

export type DisplayMarkingOptions = {
	/** `xml:lang` to render in; its base language, then untagged markings, fill whatever it does not define */
	lang?: string;
	location?: MarkingLocation;
};

const resolveMarking = (markings: Markings, lang: string): Marking | undefined => {
	const chain = [...new Set([lang, lang.split(/[-_]/)[0], ''])]
		.map((tag) => markings.get(tag))
		.filter((marking): marking is Marking => marking !== undefined);
	if (chain.length <= 1) return chain[0];
	return {
		phrases: chain.flatMap(({ phrases }) => phrases),
		prefix: chain.find(({ prefix }) => prefix !== undefined)?.prefix,
		suffix: chain.find(({ suffix }) => suffix !== undefined)?.suffix,
		separator: chain.find(({ separator }) => separator !== undefined)?.separator,
	};
};

const appliesAt =
	(location: MarkingLocation) =>
	({ locations }: MarkingPhrase): boolean =>
		!locations || locations.includes(location);

const elementPhrase = (marking: Marking | undefined, location: MarkingLocation, name: string): string => {
	const applicable = marking?.phrases.filter(appliesAt(location)) ?? [];
	if (applicable.some(({ noMarkingDisplay, noNameDisplay }) => noMarkingDisplay || noNameDisplay)) return '';
	return applicable.find(({ replacePolicy }) => !replacePolicy)?.phrase ?? name;
};

const policyReplacement = (marking: Marking | undefined, location: MarkingLocation, name: string): string | undefined => {
	const entry = marking?.phrases.find((phrase) => appliesAt(location)(phrase) && phrase.replacePolicy);
	return entry && (entry.phrase ?? name);
};

/**
 * Renders a label as the marking users see, following the SPIF's marking rules:
 * policy name, then classification, then categories grouped by tag in SPIF order.
 */
export const displayMarking = (
	policy: SecurityPolicy,
	label: ISecurityLabel,
	{ lang = '', location = 'pageTop' }: DisplayMarkingOptions = {},
): SecurityLabelDisplayMarking => {
	const classification = policy.classificationsByLacv.get(label.classification);
	const present = new Set(label.categories.map(categoryKey));
	const categories: Array<{ definition: SecurityCategoryDefinition; marking: Marking | undefined; tagMarking: Marking | undefined }> =
		policy.tagSets.flatMap((tagSet) =>
			tagSet.tags.flatMap((tag) =>
				tag.categories
					.filter((definition) => present.has(categoryKey(definition)))
					.map((definition) => ({
						definition,
						marking: resolveMarking(definition.markings, lang),
						tagMarking: resolveMarking(tag.markings, lang),
					})),
			),
		);

	const root = resolveMarking(policy.markings, lang);
	const classificationMarking = classification && resolveMarking(classification.markings, lang);

	const policyPart =
		policyReplacement(root, location, policy.name) ??
		(classification && policyReplacement(classificationMarking, location, classification.name)) ??
		categories
			.map(({ definition, marking }) => policyReplacement(marking, location, definition.name))
			.find((phrase) => phrase !== undefined) ??
		policy.name;

	const suppressClassName = categories.some(({ marking }) =>
		marking?.phrases.some((phrase) => appliesAt(location)(phrase) && phrase.suppressClassName),
	);
	const classificationPart =
		suppressClassName || !classification ? '' : elementPhrase(classificationMarking, location, classification.name);

	const tagParts: string[] = [];
	let currentTag: string | undefined;
	let currentPhrases: string[] = [];
	let currentTagMarking: Marking | undefined;
	const flushTag = () => {
		if (currentPhrases.length) {
			tagParts.push(
				`${currentTagMarking?.prefix ?? ''}${currentPhrases.join(currentTagMarking?.separator ?? '/')}${currentTagMarking?.suffix ?? ''}`,
			);
		}
		currentPhrases = [];
	};
	for (const { definition, marking, tagMarking } of categories) {
		const tag = `${definition.tagSetId}|${definition.tagName}`;
		if (tag !== currentTag) {
			flushTag();
			currentTag = tag;
			currentTagMarking = tagMarking;
		}
		const phrase = elementPhrase(marking ?? tagMarking, location, definition.name);
		if (phrase) {
			currentPhrases.push(phrase);
		}
	}
	flushTag();

	const body = [policyPart, classificationPart, ...tagParts].filter(Boolean).join(root?.separator ?? ' ');
	const bgcolor = classification?.color ?? 'white';

	return {
		text: `${root?.prefix ?? ''}${body}${root?.suffix ?? ''}`,
		fgcolor: readableTextColor(bgcolor),
		bgcolor,
	};
};
