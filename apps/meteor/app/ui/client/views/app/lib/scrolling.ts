export function isAtBottom(element: HTMLElement, scrollThreshold = 0): boolean {
	return element.scrollTop + scrollThreshold >= element.scrollHeight - element.clientHeight;
}
