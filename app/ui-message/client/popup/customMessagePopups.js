import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

export const customMessagePopups = new ReactiveVar([]);

const nonReactiveGetFunc = function() {
	return customMessagePopups.get();
};

export const addMessagePopup = (configGetter, name) => {
	customMessagePopups.set([
		...Tracker.nonreactive(nonReactiveGetFunc),
		{
			configGetter,
			name,
		},
	]);
};

export const removeMessagePopup = (popupName) => {
	const customMessagePopupsList = Tracker.nonreactive(nonReactiveGetFunc);
	const element = customMessagePopupsList.findIndex(({ name }) => name === popupName);
	if (element < 0) {
		return;
	}
	const listWithRemovedElement = [...customMessagePopupsList.slice(0, element), ...customMessagePopupsList.slice(element + 1, customMessagePopupsList.length)];
	customMessagePopups.set([
		...listWithRemovedElement,
	]);
};
