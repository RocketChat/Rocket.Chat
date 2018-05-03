export default function resetSelection(reset) {
	const [el] = $('.messages-box');
	if (!el) {
		return;
	}
	const view = Blaze.getView(el);
	if (view && typeof view.templateInstance === 'function') {
		const {resetSelection} = view.templateInstance();
		typeof resetSelection === 'function' && resetSelection(reset);
	}
}
