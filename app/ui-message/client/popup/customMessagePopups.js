import { ReactiveVar } from 'meteor/reactive-var';

export const customMessagePopups = new ReactiveVar([]);

export const addMessagePopup = (configGetter) => {
	customMessagePopups.set([
		...customMessagePopups.get(),
		{
			configGetter,
		},
	]);
};
