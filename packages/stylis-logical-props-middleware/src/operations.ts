import type { RuleSet, Declaration } from './elements';
import { attachDeclaration } from './elements';
import { splitValueList } from './values';

export type Operation = (
	value: Declaration['children'],
	ruleSet: Readonly<RuleSet>,
	ltrRuleSet: Readonly<RuleSet>,
	rtlRuleSet: Readonly<RuleSet>,
) => void;

export const compileOperations = ({
	isPropertySupported,
	isPropertyValueSupported,
}: {
	isPropertySupported: (property: string) => boolean;
	isPropertyValueSupported: (property: string, value: string) => boolean;
}): Map<string, Operation> => {
	const ops = new Map<string, Operation>();

	/** Routes a value through `property`'s own fallback, if it has one. */
	const applyTo = (
		property: string,
		value: string,
		ruleSet: Readonly<RuleSet>,
		ltrRuleSet: Readonly<RuleSet>,
		rtlRuleSet: Readonly<RuleSet>,
	): void => {
		const op = ops.get(property);

		if (op) {
			op(value, ruleSet, ltrRuleSet, rtlRuleSet);
			return;
		}

		attachDeclaration(property, value, ruleSet);
	};

	const withLogicalValues = (property: string): void => {
		const logicalValues = new Map<string, boolean>(
			['start', 'inline-start', 'end', 'inline-end'].map((logicalValue) => [
				logicalValue,
				isPropertyValueSupported(property, logicalValue),
			]),
		);

		if (Array.from(logicalValues.values()).every((supported) => supported)) {
			return;
		}

		const op: Operation = (value, ruleSet, _ltrRuleSet, rtlRuleSet) => {
			switch (value) {
				case 'start':
				case 'inline-start':
					if (!logicalValues.get(value)) {
						attachDeclaration(property, 'left', ruleSet);
						attachDeclaration(property, 'right', rtlRuleSet);
						return;
					}
					break;

				case 'end':
				case 'inline-end':
					if (!logicalValues.get(value)) {
						attachDeclaration(property, 'right', ruleSet);
						attachDeclaration(property, 'left', rtlRuleSet);
						return;
					}
					break;
			}

			attachDeclaration(property, value, ruleSet);
		};

		ops.set(property, op);
	};

	const withDirectionalFallback = (property: string, ltrFallbackProperty: string, rtlFallbackProperty: string): void => {
		if (isPropertySupported(property)) {
			return;
		}

		const op: Operation = (value, _ruleSet, ltrRuleSet, rtlRuleSet): void => {
			attachDeclaration(ltrFallbackProperty, value, ltrRuleSet);
			attachDeclaration(rtlFallbackProperty, value, rtlRuleSet);
		};

		ops.set(property, op);
	};

	/**
	 * Shorthands whose value applies whole to every fallback: `border-inline`
	 * takes one border value for both sides, and the single-target mappings
	 * (`inline-size` → `width`, …) are a straight rename.
	 */
	const withFallback = (property: string, ...fallbackProperties: string[]): void => {
		if (isPropertySupported(property)) {
			return;
		}

		const op: Operation = (value, ruleSet, ltrRuleSet, rtlRuleSet): void => {
			for (const fallbackProperty of fallbackProperties) {
				applyTo(fallbackProperty, value, ruleSet, ltrRuleSet, rtlRuleSet);
			}
		};

		ops.set(property, op);
	};

	/**
	 * Shorthands over the two sides of an axis: `<start>` or `<start> <end>`.
	 * The value has to be split before it reaches the per-side fallbacks —
	 * handing `4px 8px` to a longhand emits CSS the browser drops outright, so
	 * the declaration would be lost rather than merely mispositioned.
	 */
	const withAxisFallback = (property: string, startProperty: string, endProperty: string): void => {
		if (isPropertySupported(property)) {
			return;
		}

		const op: Operation = (value, ruleSet, ltrRuleSet, rtlRuleSet): void => {
			const { components, important } = splitValueList(value);
			const [start, end = start] = components;

			if (!start) {
				attachDeclaration(property, value, ruleSet);
				return;
			}

			applyTo(startProperty, start + important, ruleSet, ltrRuleSet, rtlRuleSet);
			applyTo(endProperty, end + important, ruleSet, ltrRuleSet, rtlRuleSet);
		};

		ops.set(property, op);
	};

	/**
	 * `inset` is a physical shorthand — `<'top'>{1,4}` in the usual box order —
	 * so it expands straight to the physical sides and needs no direction
	 * handling of its own.
	 */
	const withBoxFallback = (
		property: string,
		topProperty: string,
		rightProperty: string,
		bottomProperty: string,
		leftProperty: string,
	): void => {
		if (isPropertySupported(property)) {
			return;
		}

		const op: Operation = (value, ruleSet, ltrRuleSet, rtlRuleSet): void => {
			const { components, important } = splitValueList(value);
			const [top, right = top, bottom = top, left = right] = components;

			if (!top) {
				attachDeclaration(property, value, ruleSet);
				return;
			}

			applyTo(topProperty, top + important, ruleSet, ltrRuleSet, rtlRuleSet);
			applyTo(rightProperty, right + important, ruleSet, ltrRuleSet, rtlRuleSet);
			applyTo(bottomProperty, bottom + important, ruleSet, ltrRuleSet, rtlRuleSet);
			applyTo(leftProperty, left + important, ruleSet, ltrRuleSet, rtlRuleSet);
		};

		ops.set(property, op);
	};

	withLogicalValues('float');
	withLogicalValues('clear');
	withLogicalValues('text-align');

	withDirectionalFallback('border-start-start-radius', 'border-top-left-radius', 'border-top-right-radius');
	withDirectionalFallback('border-start-end-radius', 'border-top-right-radius', 'border-top-left-radius');
	withDirectionalFallback('border-end-start-radius', 'border-bottom-left-radius', 'border-bottom-right-radius');
	withDirectionalFallback('border-end-end-radius', 'border-bottom-right-radius', 'border-bottom-left-radius');
	withDirectionalFallback('inset-inline-start', 'left', 'right');
	withDirectionalFallback('inset-inline-end', 'right', 'left');
	withDirectionalFallback('border-inline-start', 'border-left', 'border-right');
	withDirectionalFallback('border-inline-end', 'border-right', 'border-left');
	withDirectionalFallback('border-inline-start-width', 'border-left-width', 'border-right-width');
	withDirectionalFallback('border-inline-end-width', 'border-right-width', 'border-left-width');

	withDirectionalFallback('border-inline-start-style', 'border-left-style', 'border-right-style');
	withDirectionalFallback('border-inline-end-style', 'border-right-style', 'border-left-style');
	withDirectionalFallback('border-inline-start-color', 'border-left-color', 'border-right-color');
	withDirectionalFallback('border-inline-end-color', 'border-right-color', 'border-left-color');
	withDirectionalFallback('margin-inline-start', 'margin-left', 'margin-right');
	withDirectionalFallback('margin-inline-end', 'margin-right', 'margin-left');
	withDirectionalFallback('padding-inline-start', 'padding-left', 'padding-right');
	withDirectionalFallback('padding-inline-end', 'padding-right', 'padding-left');

	withFallback('border-inline', 'border-inline-start', 'border-inline-end');
	withAxisFallback('border-inline-width', 'border-inline-start-width', 'border-inline-end-width');
	withAxisFallback('border-inline-style', 'border-inline-start-style', 'border-inline-end-style');
	withAxisFallback('border-inline-color', 'border-inline-start-color', 'border-inline-end-color');
	withAxisFallback('inset-inline', 'inset-inline-start', 'inset-inline-end');
	withAxisFallback('margin-inline', 'margin-inline-start', 'margin-inline-end');
	withAxisFallback('padding-inline', 'padding-inline-start', 'padding-inline-end');

	withFallback('border-block-start', 'border-top');
	withFallback('border-block-end', 'border-bottom');
	withFallback('border-block-start-width', 'border-top-width');
	withFallback('border-block-end-width', 'border-bottom-width');
	withFallback('border-block-start-style', 'border-top-style');
	withFallback('border-block-end-style', 'border-bottom-style');
	withFallback('border-block-start-color', 'border-top-color');
	withFallback('border-block-end-color', 'border-bottom-color');
	withFallback('inset-block-start', 'top');
	withFallback('inset-block-end', 'bottom');
	withFallback('margin-block-start', 'margin-top');
	withFallback('margin-block-end', 'margin-bottom');
	withFallback('padding-block-start', 'padding-top');
	withFallback('padding-block-end', 'padding-bottom');

	withFallback('border-block', 'border-block-start', 'border-block-end');
	withAxisFallback('border-block-width', 'border-block-start-width', 'border-block-end-width');
	withAxisFallback('border-block-style', 'border-block-start-style', 'border-block-end-style');
	withAxisFallback('border-block-color', 'border-block-start-color', 'border-block-end-color');
	withAxisFallback('inset-block', 'inset-block-start', 'inset-block-end');
	withAxisFallback('margin-block', 'margin-block-start', 'margin-block-end');
	withAxisFallback('padding-block', 'padding-block-start', 'padding-block-end');

	withBoxFallback('inset', 'top', 'right', 'bottom', 'left');

	withFallback('inline-size', 'width');
	withFallback('min-inline-size', 'min-width');
	withFallback('max-inline-size', 'max-width');
	withFallback('block-size', 'height');
	withFallback('min-block-size', 'min-height');
	withFallback('max-block-size', 'max-height');

	return ops;
};
