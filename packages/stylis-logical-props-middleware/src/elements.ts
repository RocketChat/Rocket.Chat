import type { Element } from 'stylis';
import { DECLARATION, node, RULESET } from 'stylis';

export type RuleSet = Element & {
	type: typeof RULESET;
	children: Element[];
	props: string[];
};

export type Declaration = Element & {
	type: typeof DECLARATION;
	props: string;
	children: string;
};

export const isRuleSet = (element: Element): element is RuleSet => element.type === RULESET;

export const isDeclaration = (element: Element): element is Declaration => element.type === DECLARATION;

export const attachDeclaration = (property: string, value: string, ruleSet: RuleSet): void => {
	const declaration = node(
		`${property}:${value};`,
		ruleSet,
		ruleSet,
		DECLARATION,
		property as unknown as string[],
		value as unknown as Element[],
		property.length,
	);

	ruleSet.children.push(declaration);
};
