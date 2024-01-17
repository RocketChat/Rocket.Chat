export const onMouseEventPreventSideEffects = (e: MouseEvent): void => {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
};
