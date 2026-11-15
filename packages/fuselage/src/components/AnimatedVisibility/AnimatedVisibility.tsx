import { css, keyframes } from '@rocket.chat/css-in-js';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { useStyle } from '../../hooks/useStyle';
import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';

export type VisibilityType = 'hidden' | 'visible' | 'hiding' | 'unhiding' | undefined;

export type AnimatedVisibilityProps = {
	children: ReactNode;
	visibility?: VisibilityType;
};

const AnimatedVisibility = (props: AnimatedVisibilityProps) => {
	const propVisibility = props.visibility || AnimatedVisibility.HIDDEN;

	const [visibility, setVisibility] = useState<VisibilityType>(propVisibility);

	useEffect(() => {
		setVisibility((visibility) => {
			if (propVisibility === AnimatedVisibility.VISIBLE && visibility !== propVisibility) {
				return AnimatedVisibility.UNHIDING;
			}

			if (propVisibility === AnimatedVisibility.HIDDEN && visibility !== propVisibility) {
				return AnimatedVisibility.HIDING;
			}

			return visibility;
		});
	}, [propVisibility]);

	const className = useStyle(
		css`
			animation-duration: 230ms;
			animation-fill-mode: both;

			${
				visibility === AnimatedVisibility.HIDING &&
				css`
					animation-name: ${keyframes`
        from {
          transform: translate3d(0, 0, 0);
          opacity: 1;
        }

        to {
          transform: translate3d(0, 1rem, 0);
          opacity: 0;
        }
      `};
				`
			}

			${
				visibility === AnimatedVisibility.UNHIDING &&
				css`
					animation-name: ${keyframes`
        from {
          transform: translate3d(0, 1rem, 0);
          opacity: 0;
        }

        to {
          transform: translate3d(0, 0, 0);
          opacity: 1;
        }
      `};
				`
			}
		`,
		null,
	);

	const handleAnimationEnd = useCallback(
		() =>
			setVisibility((visibility) => {
				if (visibility === AnimatedVisibility.HIDING) {
					return AnimatedVisibility.HIDDEN;
				}

				if (visibility === AnimatedVisibility.UNHIDING) {
					return AnimatedVisibility.VISIBLE;
				}

				return visibility;
			}),
		[],
	);

	const transformFn = useCallback(
		(props: any) => {
			if (props.onAnimationEnd === undefined) {
				props.onAnimationEnd = handleAnimationEnd;
			}
			props.className = className && appendClassName(props.className, className);
			return props;
		},
		[className, handleAnimationEnd],
	);

	const composedFn = useComposedBoxTransform(transformFn);
	if (visibility === AnimatedVisibility.HIDDEN) {
		return null;
	}

	return <BoxTransforms.Provider value={composedFn}>{props.children}</BoxTransforms.Provider>;
};

AnimatedVisibility.HIDDEN = 'hidden' as VisibilityType;
AnimatedVisibility.VISIBLE = 'visible' as VisibilityType;
AnimatedVisibility.HIDING = 'hiding' as VisibilityType;
AnimatedVisibility.UNHIDING = 'unhiding' as VisibilityType;

export default AnimatedVisibility;
