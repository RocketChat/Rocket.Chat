const validateChannelName = (name) => {
	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return name.length === 0 || reg.test(name);
};
Template.createChannel.helpers({
	invalidChannel() {
		const name = Template.instance().name.get();
		return !validateChannelName(name);
	},
	readOnlyIsDisabled() {
		return 'disabled';
	},
	typeLabel() {
		const type = Template.instance().type.get();
		return t(type === 'p' ? 'Private Channel': 'Public Channel');
	},
	typeDescription() {
		const type = Template.instance().type.get();
		return t(type === 'p' ? 'Just invited people can access this channel': 'Everyone can access this channel');
	},
	createIsDisabled() {
		const name = Template.instance().name.get();

		if (name.length === 0 || !validateChannelName(name)) {
			return 'disabled';
		}
		return '';
	},
	iconType() {
		const type = Template.instance().type.get();
		return type === 'p' ? 'lock' : 'hashtag';
	}
});

Template.createChannel.events({
	'change [name=type]'(e, t) {
		t.type.set(e.target.checked ? e.target.value : 'p');
	},
	'input [name=name]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const old = input.value;
		const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
		const modified = [...old.replace(' ', '').toLocaleLowerCase()].filter(f => reg.test(f)).splice(0, 22).join('');

		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.name.set(modified);
	}
});

Template.createChannel.onCreated(function() {
	this.name = new ReactiveVar('');
	this.type = new ReactiveVar('d');
});
