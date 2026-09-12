import { memoize } from '@rocket.chat/memo';

import { createAnimationName, escapeName } from './names';

/**
 * A shared state created by the upmost Evaluable in the call stack
 */
type EvaluationContext = string[];

/**
 * It can be stored at this module scope because all Evaluable calls are
 * synchronous, therefore the first call must create and destroy this context.
 */
let currentContext: EvaluationContext | undefined = undefined;

/**
 * Holds to the evaluation context inside a Evaluable.
 *
 * @returns a pair of the evaluation context and a function to free it,
 *          returning the additional evaluation stored at the context.
 */
export const holdContext = (): [EvaluationContext, () => string] => {
	if (currentContext) {
		return [currentContext, () => ''];
	}

	currentContext = [];

	return [
		currentContext,
		() => {
			const additions = (currentContext || []).join('');
			currentContext = undefined;
			return additions;
		},
	];
};

/**
 * A function that lazily evaluates a special string interpolation.
 */
export type Evaluable = <T extends readonly unknown[]>(...args: T) => string;

const isEvaluable = (x: unknown): x is Evaluable => typeof x === 'function';

const staticEvaluable = memoize(<T extends Evaluable>(content: string): T => Object.freeze(() => content) as T);

export type cssFn = Evaluable;
export type keyframesFn = Evaluable;

const evaluateValue = (value: unknown, args: readonly unknown[]): string => {
	if (isEvaluable(value) || typeof value === 'function') {
		return evaluateValue(value(...args), args);
	}

	if (value === false || value === undefined || value === null) {
		return '';
	}

	if (Array.isArray(value)) {
		return value.map((innerValue) => evaluateValue(innerValue, args)).join('');
	}

	return String(value);
};

const reduceEvaluable = ([first, ...rest]: readonly string[], values: readonly unknown[], args: readonly unknown[]): string =>
	values.reduce<string>((string, value, i) => string + evaluateValue(value, args) + rest[i], first).trim();

/**
 * Template string tag to declare CSS content chunks.
 *
 * @returns a callback to render the CSS content
 */
export const css = (slices: TemplateStringsArray, ...values: readonly unknown[]): cssFn => {
	if (!slices || slices.length === 0 || slices.some((slice) => typeof slice !== 'string')) {
		return staticEvaluable('');
	}

	if (!values.some((value) => typeof value === 'function')) {
		const content = reduceEvaluable(slices, values, []);

		return staticEvaluable(content);
	}

	return <T extends readonly unknown[]>(...args: T): string => {
		const [, freeContext] = holdContext();

		const content = reduceEvaluable(slices, values, args);

		return content + freeContext();
	};
};

/**
 * Template string tag to declare CSS `@keyframe` at-rules.
 *
 * @returns a callback to render the CSS at-rule content
 */
export const keyframes = (slices: TemplateStringsArray, ...values: unknown[]): keyframesFn => {
	if (!slices || slices.length === 0 || slices.some((slice) => typeof slice !== 'string')) {
		return staticEvaluable('none');
	}

	const fn: keyframesFn = <T extends readonly unknown[]>(...args: T): string => {
		const [context, freeContext] = holdContext();

		const content = reduceEvaluable(slices, values, args);

		const animationName = createAnimationName(content);
		const escapedAnimationName = escapeName(animationName);

		context.push(`@keyframes ${escapedAnimationName}{${content}}`);

		freeContext();

		return escapedAnimationName;
	};

	return fn;
};
