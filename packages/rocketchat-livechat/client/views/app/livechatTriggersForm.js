import toastr from 'toastr';

Template.livechatTriggersForm.helpers({
	name() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.name;
	},
	description() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.description;
	},
	enabled() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return trigger && trigger.enabled;
	},
	runOnce() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		return (trigger && trigger.runOnce) || false;
	},
	conditions() {
		return Template.instance().conditions.get();
	},
	actions() {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (!trigger) {
			return [];
		}

		return trigger.actions;
	},
});

Template.livechatTriggersForm.onCreated(function() {
	this.conditions = new ReactiveVar([]);

	this.subscribe('livechat:triggers', FlowRouter.getParam('_id'));

	this.autorun(() => {
		const trigger = LivechatTrigger.findOne(FlowRouter.getParam('_id'));
		if (trigger) {
			this.conditions.set(trigger.conditions);
		} else {
			this.conditions.set([{id:1, name:'page-url', value:''}]);
		}
	});
});

Template.livechatTriggersForm.events({
	'click button.add-condition'(e, instance) {
		e.preventDefault();
		const newConditions = instance.conditions.get();
		const idArray = newConditions.map(function(o) { return o.id; });
		idArray.push(0);
		const newId = Math.max.apply(Math, idArray);

		const emptyCondition = {id: newId + 1, name:'page-url', value:''};
		newConditions.push(emptyCondition);
		instance.conditions.set(newConditions);
	},
	'click .remove-condition'(e, instance) {
		e.preventDefault();

		let newConditions = instance.conditions.get();
		newConditions = _.reject(newConditions, (condition) => { return condition.id === this.id; });
		instance.conditions.set(newConditions);
	},
	'submit #trigger-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const data = {
			_id: FlowRouter.getParam('_id'),
			name: instance.$('input[name=name]').val(),
			description: instance.$('input[name=description]').val(),
			enabled: instance.$('input[name=enabled]:checked').val() === '1',
			runOnce: instance.$('input[name=runOnce]:checked').val() === '1',
			conditions: [],
			actions: [],
		};

		$('.each-condition').each(function() {
			data.conditions.push({
				name: $('.trigger-condition', this).val(),
				value: $(`.${ $('.trigger-condition', this).val() }-value`).val(),
			});
		});

		$('.each-action').each(function() {
			if ($('.trigger-action', this).val() === 'send-message') {
				const params = {
					sender: $('[name=send-message-sender]', this).val(),
					msg: $('[name=send-message-msg]', this).val(),
				};
				if (params.sender === 'custom') {
					params.name = $('[name=send-message-name]', this).val();
				}
				data.actions.push({
					name: $('.trigger-action', this).val(),
					params,
				});
			} else {
				data.actions.push({
					name: $('.trigger-action', this).val(),
					value: $(`.${ $('.trigger-action', this).val() }-value`).val(),
				});
			}
		});

		Meteor.call('livechat:saveTrigger', data, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			FlowRouter.go('livechat-triggers');

			toastr.success(t('Saved'));
		});
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-triggers');
	},
});
