import { ReactiveVar } from 'meteor/reactive-var';

export const customMessagePopups = new ReactiveVar([]);

export const addMessagePopup = (configGetter, name) => {
	customMessagePopups.set([
		...customMessagePopups.get(),
		{
			configGetter,
			name,
		},
	]);
};

export const removeMessagePopup = (popupName) => {
	const customMessagePopupsList = customMessagePopups.get();
	const element = customMessagePopupsList.findIndex(({ name }) => name === popupName);
	if (element < 0) {
		return;
	}
	const listWithRemovedElement = [...customMessagePopupsList.slice(0, element), ...customMessagePopupsList.slice(element + 1, customMessagePopupsList.length)];
	customMessagePopups.set([
		...listWithRemovedElement,
	]);
};
