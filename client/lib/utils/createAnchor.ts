export const createAnchor = (id: string): HTMLDivElement => {
	const div = document.createElement('div');
	div.id = id;
	document.body.appendChild(div);
	return div;
};
