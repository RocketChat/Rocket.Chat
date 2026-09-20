import { cssSupports } from '@rocket.chat/css-supports';
import type { Element, Middleware } from 'stylis';
import { node, RULESET, serialize } from 'stylis';

import type { RuleSet } from './elements';
import { attachDeclaration, isDeclaration, isRuleSet } from './elements';
import { compileOperations } from './operations';

export const createLogicalPropertiesMiddleware = ({
	isPropertySupported = (property: string): boolean => cssSupports(`${property}:inherit`),
	isPropertyValueSupported = (property: string, value: string): boolean => cssSupports(`${property}:${value}`),
}: {
	isPropertySupported?: (property: string) => boolean;
	isPropertyValueSupported?: (property: string, value: string) => boolean;
} = {}): Middleware => {
	const ops = compileOperations({
		isPropertySupported,
		isPropertyValueSupported,
	});

	return (ruleSet: Element, _index, _children, callback): undefined | string => {
		if (!isRuleSet(ruleSet) || ruleSet.root !== null) {
			return undefined;
		}

		const ltrRuleSet = node(
			ruleSet.props.map((selector) => `html:not([dir=rtl]) ${selector}`).join(','),
			undefined as unknown as Element,
			undefined as unknown as Element,
			RULESET,
			ruleSet.props.map((selector) => `html:not([dir=rtl]) ${selector}`),
			[],
			0,
		) as RuleSet;

		const rtlRuleSet = node(
			ruleSet.props.map((selector) => `[dir=rtl] ${selector}`).join(','),
			undefined as unknown as Element,
			undefined as unknown as Element,
			RULESET,
			ruleSet.props.map((selector) => `[dir=rtl] ${selector}`),
			[],
			0,
		) as RuleSet;

		const rules = ruleSet.children;
		ruleSet.children = [];
		ruleSet.return = '';

		for (const rule of rules as Element[]) {
			if (!isDeclaration(rule)) {
				ruleSet.children.push(rule);
				continue;
			}

			const op = ops.get(rule.props);

			if (op) {
				op(rule.children, ruleSet, ltrRuleSet, rtlRuleSet);
				continue;
			}

			attachDeclaration(rule.props, rule.children, ruleSet);
		}

		return serialize([ltrRuleSet, rtlRuleSet], callback);
	};
};
