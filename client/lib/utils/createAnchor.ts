export const createAnchor = (id: string, target = document.body): HTMLDivElement => {
	const div = document.createElement('div');
	div.id = id;
	target.appendChild(div);
	return div;
};
