import { css, keyframes } from '@rocket.chat/css-in-js';
import type { AnimationEventHandler, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { useStyle } from '../../hooks/useStyle';
import type { BoxProps } from '../Box';

export type VisibilityType = 'hidden' | 'visible' | 'hiding' | 'unhiding' | undefined;

type ClassNameProp = BoxProps['className'];

// A Box child accepts a css function or an array; Box turns those into a class name, so they are kept as an array
const appendAnimation = (current: ClassNameProp, animation: string): ClassNameProp =>
	typeof current === 'function' || Array.isArray(current) ? [...[current].flat(), animation] : appendClassName(current, animation);

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

	if (visibility === AnimatedVisibility.HIDDEN) {
		return null;
	}

	return patchChildren(props.children, (childProps: { className?: ClassNameProp; onAnimationEnd?: AnimationEventHandler }) => ({
		...childProps,
		className: className ? appendAnimation(childProps.className, className) : childProps.className,
		onAnimationEnd: childProps.onAnimationEnd ?? handleAnimationEnd,
	}));
};

AnimatedVisibility.HIDDEN = 'hidden' as VisibilityType;
AnimatedVisibility.VISIBLE = 'visible' as VisibilityType;
AnimatedVisibility.HIDING = 'hiding' as VisibilityType;
AnimatedVisibility.UNHIDING = 'unhiding' as VisibilityType;

export default AnimatedVisibility;
