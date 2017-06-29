const validateChannelName = (name) => {
	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return name.length === 0 || reg.test(name);
};

Template.createChannel.helpers({
	inUse() {
		const instance = Template.instance();
		return instance.inUse.get();
	},
	invalidChannel() {
		const instance = Template.instance();
		const invalid = instance.invalid.get();
		const inUse = instance.inUse.get();
		return invalid || inUse;
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
		const instance = Template.instance();
		const invalid = instance.invalid.get();
		const inUse = instance.inUse.get();
		const name = Template.instance().name.get();

		if (name.length === 0 || invalid || inUse === true || inUse === undefined) {
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
		t.invalid.set(!validateChannelName(input.value));
		if (input.value !== t.name.get()) {
			t.inUse.set(undefined);
			t.checkChannel(input.value);
			t.name.set(modified);
		}
	},
	'submit form'(e, instance) {
		e.preventDefault();
		const name = e.target.name.value;
		const type = instance.type.get();
		const isPrivate = type === 'p';
		const readOnly = false;//instance.find('#channel-ro').checked;

		if (instance.invalid.get() || instance.inUse.get()) {
			return e.target.name.focus();
		}
		Meteor.call(isPrivate ? 'createPrivateGroup' : 'createChannel', name, instance.selectedUsers.get(), readOnly, function(err, result) {
			if (err) {
				if (err.error === 'error-invalid-name') {
					return instance.invalid.set(true);
				}
				if (err.error === 'error-duplicate-channel-name') {
					return instance.inUse.set(true);
				}
				return;
			}
			if (!isPrivate) {
				RocketChat.callbacks.run('aftercreateCombined', { _id: result.rid, name });
			}
			return FlowRouter.go(isPrivate ? 'group' : 'channel', { name }, FlowRouter.current().queryParams);
		});
		return false;
	}
});

Template.createChannel.onRendered(function functionName() {
	this.firstNode.querySelector('[name=name]').focus();
});

Template.createChannel.onCreated(function() {
	this.name = new ReactiveVar('');
	this.type = new ReactiveVar('d');
	this.inUse = new ReactiveVar(undefined);
	this.invalid = new ReactiveVar(false);
	this.selectedUsers = new ReactiveVar([]);
	this.checkChannel = _.debounce((name) => {
		if (validateChannelName(name)) {
			return Meteor.call('roomNameExists', name, (error, result) => {
				if (error) {
					return;
				}
				this.inUse.set(result);
			});
		}
		this.inUse.set(undefined);
	}, 1000);
});
