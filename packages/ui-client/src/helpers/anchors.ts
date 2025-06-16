export const ensureAnchorElement = (id: string): HTMLElement => {
	const existingAnchor = document.getElementById(id);
	if (existingAnchor) return existingAnchor;

	const newAnchor = document.createElement('div');
	newAnchor.id = id;
	document.body.appendChild(newAnchor);
	return newAnchor;
};

const getAnchorRefCount = (anchorElement: HTMLElement): number => {
	const { refCount } = anchorElement.dataset;
	if (refCount) return parseInt(refCount, 10);
	return 0;
};

const setAnchorRefCount = (anchorElement: HTMLElement, refCount: number): void => {
	anchorElement.dataset.refCount = String(refCount);
};

export const refAnchorElement = (anchorElement: HTMLElement): void => {
	setAnchorRefCount(anchorElement, getAnchorRefCount(anchorElement) + 1);

	if (anchorElement.parentElement !== document.body) {
		document.body.appendChild(anchorElement);
	}
};

export const unrefAnchorElement = (anchorElement: HTMLElement): void => {
	const refCount = getAnchorRefCount(anchorElement) - 1;
	setAnchorRefCount(anchorElement, refCount);

	if (refCount <= 0) {
		document.body.removeChild(anchorElement);
	}
};
