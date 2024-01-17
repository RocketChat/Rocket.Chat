export const delegate = ({
	parent = document,
	eventName,
	elementSelector,
	listener,
}: {
	parent?: Document | Element;
	eventName: string;
	elementSelector: string;
	listener: (this: Element, e: Event, currentTarget: Element) => void;
}): (() => void) => {
	const effectiveListener = function (this: Document | Element, e: Event): void {
		// loop parent nodes from the target to the delegation node
		for (let { target } = e; target && target instanceof Element && target !== this; target = target.parentNode) {
			if (target.matches(elementSelector)) {
				listener.call(target, e, target);
				break;
			}
		}
	};

	parent.addEventListener(eventName, effectiveListener, false);

	return (): void => {
		parent.removeEventListener(eventName, effectiveListener, false);
	};
};

export const triggerClick = (target: EventTarget | null): void => {
	const clickEvent = document.createEvent('HTMLEvents');
	clickEvent.initEvent('click', true, false);
	target?.dispatchEvent(clickEvent);
};
