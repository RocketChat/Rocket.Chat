export const useCreateStyleContainer = (id: string) => {
	const refElement = document.getElementById('css-theme') || document.head.lastChild;
	const styleElement = document.createElement('style');
	styleElement.setAttribute('id', id);
	document.head.insertBefore(styleElement, refElement);
	return document.getElementById(id) || document.head.appendChild(document.createElement('style'));
};
