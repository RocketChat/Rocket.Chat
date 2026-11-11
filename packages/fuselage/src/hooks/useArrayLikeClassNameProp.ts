import type { cssFn } from '@rocket.chat/css-in-js';
import { css } from '@rocket.chat/css-in-js';

import { useStyle } from './useStyle';
import { appendClassName } from '../helpers/appendClassName';
import type { Falsy } from '../types/Falsy';

export const useArrayLikeClassNameProp = <
	T extends {
		className?: string | cssFn | (string | cssFn | Falsy)[];
	},
>(
	props: T,
): T & { className: string } => {
	const classNames = props.className ? ([] as (string | cssFn | Falsy)[]).concat(props.className) : [];

	const cssFns = classNames.filter((value): value is cssFn => typeof value === 'function');
	const stylesClassName = useStyle(
		css`
			${cssFns}
		`,
		props,
	);

	const strings = classNames.filter((value): value is string => typeof value === 'string');

	const className = strings.reduce((className, string) => appendClassName(className, string), stylesClassName || '');

	return Object.assign(props, { className });
};
