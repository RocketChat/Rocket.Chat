import type { DOMAttributes } from 'react';

import { pickWebInteractionHandlers } from './pickWebInteractionHandlers';
import type { WebInteractionHandlers } from './pickWebInteractionHandlers';

type WebContainerHandlers<TElement extends Element> = WebInteractionHandlers<TElement> & Pick<DOMAttributes<TElement>, 'onClick'>;

/**
 * The DOM handlers a consumer hangs on a container, to spread on the literal render element. A container has no press
 * of its own, so its `onClick` is forwarded as it is.
 */
export const pickWebContainerHandlers = <TElement extends Element>(
	props: WebContainerHandlers<TElement>,
): WebContainerHandlers<TElement> =>
	props.onClick ? { ...pickWebInteractionHandlers(props), onClick: props.onClick } : pickWebInteractionHandlers(props);
