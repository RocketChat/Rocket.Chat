import _ from 'underscore';

Template.rocketletManage.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.rocketlet = new ReactiveVar({});
	this.settings = new ReactiveVar({});

	const id = FlowRouter.getParam('rocketletId');

	console.log(id);

	const got = { info: false, settings: false };

	RocketChat.API.get(`rocketlets/${ id }`).then((result) => {
		instance.rocketlet.set(result.rocketlet);
		console.log(result.rocketlet);

		got.info = true;
		if (got.info && got.settings) {
			this.ready.set(true);
		}
	});

	RocketChat.API.get(`rocketlets/${ id }/settings`).then((result) => {
		Object.keys(result.settings).forEach((k) => {
			result.settings[k].oldValue = result.settings[k].value;
		});

		instance.settings.set(result.settings);
		console.log(instance.settings.get());

		got.settings = true;
		if (got.info && got.settings) {
			this.ready.set(true);
		}
	});
});

Template.rocketletManage.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	rocketlet() {
		return Template.instance().rocketlet.get();
	},
	settings() {
		return Object.values(Template.instance().settings.get());
	},
	parseDescription(i18nDescription) {
		const item = RocketChat.Markdown.parseMessageNotEscaped({ html: t(i18nDescription) });

		item.tokens.forEach((t) => item.html = item.html.replace(t.token, t.text));

		return item.html;
	}
});

Template.rocketletManage.events({
	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each((index, codeMirror) => codeMirror.CodeMirror.refresh());
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},

	'click .save': (e, t) => {
		const toSave = [];

		Object.keys(t.settings.get()).forEach((k) => {
			const setting = t.settings.get()[k];
			if (setting.hasChanged) {
				toSave.push(setting);
			}
		});

		if (toSave.length === 0) {
			console.log('Nothing to save..');
			return;
		}

		const rocketletId = FlowRouter.getParam('rocketletId');
		RocketChat.API.post(`rocketlets/${ rocketletId }/settings`, undefined, { settings: toSave }).then((result) => {
			console.log('Updating results:', result);
		});
	},

	'change .input-monitor, keyup .input-monitor': _.throttle(function(e, t) {
		let value = _.trim($(e.target).val());
		switch (this.type) {
			case 'int':
				value = parseInt(value);
				break;
			case 'boolean':
				value = value === '1';
		}

		const setting = t.settings.get()[this.id];
		setting.value = value;

		if (setting.oldValue !== setting.value) {
			t.settings.get()[this.id].hasChanged = true;
		}
	}, 500)
});
