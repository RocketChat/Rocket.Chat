import type { AllHTMLAttributes } from 'react';

import { prependClassName } from '../helpers/prependClassName';
import { prependRcxClassNames } from '../helpers/prependRcxClassNames';

export const useBoxOnlyProps = <
	T extends {
		className: string;
	},
>(
	props: T & {
		animated?: boolean;
		withRichContent?: boolean | 'inlineWithoutBreaks';
		htmlSize?: AllHTMLAttributes<HTMLElement>['size'];
		size?: AllHTMLAttributes<HTMLElement>['size'];
		focusable?: boolean;
	},
): T => {
	prependRcxClassNames(props);

	if (props.animated) {
		props.className = prependClassName(props.className, 'rcx-box--animated');
		delete props.animated;
	}

	if (props.withRichContent) {
		if (props.withRichContent === 'inlineWithoutBreaks') {
			props.className = prependClassName(props.className, 'rcx-box--with-inline-elements');
		} else {
			props.className = prependClassName(props.className, 'rcx-box--with-inline-elements');

			props.className = prependClassName(props.className, 'rcx-box--with-block-elements');
		}
	}

	if (props.htmlSize) {
		props.size = props.htmlSize;
		delete props.htmlSize;
	}

	if (props.focusable) {
		props.className = prependClassName(props.className, 'rcx-box--focusable');
		delete props.focusable;
	}

	delete props.withRichContent;

	props.className = prependClassName(props.className, 'rcx-box rcx-box--full');

	return props;
};
