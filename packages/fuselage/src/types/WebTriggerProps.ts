import type { ReactEventHandler } from 'react';

import type { WebPressAlias, WebProps } from './WebAttributes';
import type { WebInteractionHandlers } from '../helpers/pickWebInteractionHandlers';

// A contract as the web renderer of a part that triggers something takes it, such as an avatar a tooltip is set on: the
// press, and the handlers react-aria hands to the element. A frame module names one of these instead of the DOM element type.

type WebTriggerAttributes<TElement extends Element> = WebPressAlias<TElement> &
	WebInteractionHandlers<TElement> & {
		title?: string;
	};

/** For a part rendered as a `figure`. */
export type WebFigureProps<TContract> = WebProps<TContract, HTMLElement> & WebTriggerAttributes<HTMLElement>;

/** For a part rendered as an `img`. */
export type WebImageProps<TContract> = WebProps<TContract, HTMLImageElement> &
	WebTriggerAttributes<HTMLImageElement> & {
		onLoad?: ReactEventHandler<HTMLImageElement>;
		onError?: ReactEventHandler<HTMLImageElement>;
	};

/** For a part rendered as a `div` that can be pressed. */
export type WebPressableDivProps<TContract> = WebProps<TContract, HTMLDivElement> &
	WebPressAlias<HTMLDivElement> & {
		title?: string;
	};
