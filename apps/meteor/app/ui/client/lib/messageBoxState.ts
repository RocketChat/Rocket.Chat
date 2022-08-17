import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';

export const messageBoxState = {
	saveValue: _.debounce(({ rid, tmid }: { rid?: IMessage['rid']; tmid?: IMessage['tmid'] }, value: string) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		value ? Meteor._localStorage.setItem(key, value) : Meteor._localStorage.removeItem(key);
	}, 1000),

	restoreValue: ({ rid, tmid }: { rid?: IMessage['rid']; tmid?: IMessage['tmid'] }) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		return Meteor._localStorage.getItem(key);
	},

	restore: ({ rid, tmid }: { rid?: IMessage['rid']; tmid?: IMessage['tmid'] }, input: HTMLInputElement) => {
		const value = messageBoxState.restoreValue({ rid, tmid });
		if (typeof value === 'string') {
			messageBoxState.set(input, value);
		}
	},

	save: ({ rid, tmid }: { rid?: IMessage['rid']; tmid?: IMessage['tmid'] }, input: HTMLInputElement) => {
		messageBoxState.saveValue({ rid, tmid }, input.value);
	},

	set: (input: HTMLInputElement, value: string) => {
		input.value = value;
		$(input).trigger('change').trigger('input');
	},

	purgeAll: () => {
		Object.keys(Meteor._localStorage)
			.filter((key) => key.indexOf('messagebox_') === 0)
			.forEach((key) => Meteor._localStorage.removeItem(key));
	},
};
