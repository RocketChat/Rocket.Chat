Template.channelSettings__tokenpass.helpers({
	addDisabled() {
		const {balance, token} = Template.instance();
		return balance.get() && token.get() ? '' : 'disabled';
	},
	list() {
		return Template.instance().list.get();
	},
	save() {
		const {list, initial} = Template.instance();
		return JSON.stringify(list.get()) !== JSON.stringify(initial);
	},
	editing() {
		return Template.instance().editing.get() ? 'tokenpass__editing' : '';
	},
	requiredChecked() {
		return Template.instance().requireAll.get() ? 'checked' : '';
	},
	requiredLabel() {
		return Template.instance().requireAll.get() ? t('Require_all_tokens') : t('Require_any_token');
	},
	requiredDisabled() {
		return !Template.instance().editing.get() ? 'disabled' : '';
	},
	editDisabled() {
		return Template.instance().editing.get() ? 'disabled' : '';
	}
});

Template.channelSettings__tokenpass.onCreated(function() {
	const room = ChatRoom.findOne(this.data.rid, { fields: { tokenpass : 1 } });

	this.editing = new ReactiveVar(false);
	this.initial = room.tokenpass;
	this.requireAll = new ReactiveVar(room.tokenpass.require === 'all');
	this.list = new ReactiveVar(this.initial.tokens);
	this.token = new ReactiveVar('');
	this.balance = new ReactiveVar('');
});

Template.channelSettings__tokenpass.events({
	'click .js-edit'(e, i) {
		i.editing.set(true);
	},
	'input [name=token]'(e, i) {
		i.token.set(e.target.value);
	},
	'input [name=balance]'(e, i) {
		i.balance.set(e.target.value);
	},
	'click .js-add'(e, i) {
		e.preventDefault();
		const instance = Template.instance();
		const {balance, token, list} = instance;
		list.set([...list.get().filter(t => t.token !== token), {token:token.get(), balance: balance.get()}]);


		[...i.findAll('input')].forEach(el => el.value = '');
		return balance.set('') && token.set('');
	},
	'click .js-remove'(e, instance) {
		e.preventDefault();
		const {list, editing} = instance;

		if (!editing.get()) {
			return;
		}
		list.set(list.get().filter(t => t.token !== this.token));

	},
	'click .js-save'(e, i) {
		e.preventDefault();

		const tokenpass = {
			require: i.find('[name=requireAllTokens]').checked ? 'all' : 'any',
			tokens: i.list.get()
		};

		Meteor.call('saveRoomSettings', this.rid, 'tokenpass', tokenpass, function(err) {
			if (err) {
				return handleError(err);
			}
			i.editing.set(false);
			i.token.set('');
			i.balance.set('');
			i.initial = tokenpass;
			[...i.findAll('input')].forEach(el => el.value = '');
			return toastr.success(TAPi18n.__('Room_tokenpass_config_changed_successfully'));
		});
	},
	'click .js-cancel'(e, i) {
		e.preventDefault();
		i.editing.set(false);
		i.list.set(i.initial.tokens);
		i.token.set('');
		i.balance.set('');
		[...i.findAll('input')].forEach(el => el.value = '');
	},
	'change [name=requireAllTokens]'(e, instance) {
		instance.requireAll.set(e.currentTarget.checked);
	}
});
