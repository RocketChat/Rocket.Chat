Template.livechatDepartmentForm.helpers({
	department() {
		// return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get() : { enabled: true };
		return Template.instance().department.get();
	},
	agents() {
		return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get().agents : []
	}
});

Template.livechatDepartmentForm.events({
	'submit #department-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var _id = $(e.currentTarget).data('id');
		var enabled = instance.$('input[name=enabled]:checked').val()
		var name = instance.$('input[name=name]').val()
		var description = instance.$('textarea[name=description]').val()

		if (enabled !== "1" && enabled !== "0") {
			return toastr.error(t('Please_select_enabled_yes_or_no'));
		}

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		agents = instance.department && !_.isEmpty(instance.department.get()) ? instance.department.get().agents : [];

		departmentData = {
			enabled: enabled === "1" ? true : false,
			name: name.trim(),
			description: description.trim(),
			agents: agents
		}

		Meteor.call('livechat:saveDepartment', _id, departmentData, function(error, result) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-departments');
		});
	},

	'click button.back' (e, instance) {
		e.preventDefault();
		FlowRouter.go('livechat-departments');
	},

	'click button.add-agent' (e, instance) {
		e.preventDefault();
		var $btn = $(e.currentTarget);

		var $agent = instance.$('input[name=agent]')

		if ($agent.val().trim() === '') {
			return toastr.error(t('Please_fill_a_username'));
		}

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		Meteor.call('livechat:searchAgent', $agent.val(), function(error, user) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}
			department = instance.department.get() || {};
			if (department.agents === undefined || !_.isArray(department.agents)) {
				department.agents = [];
			}
			if (!_.findWhere(department.agents, { _id: user._id })) {
				department.agents.push(user);
			}
			instance.department.set(department);
			$agent.val('');
		});
	},

	'click a.remove-agent' (e, instance) {
		e.preventDefault();
		department = instance.department.get();
		department.agents = _.reject(department.agents, (agent) => { return agent._id === this._id });
		instance.department.set(department);
	},

	'keydown input[name=agent]' (e, instance) {
		if (e.keyCode === 13) {
			e.preventDefault();
			$("button.add-agent").click();
		}
	}
});

Template.livechatDepartmentForm.onCreated(function() {
	this.department = new ReactiveVar({ enabled: true });
	this.autorun(() => {
		var sub = this.subscribe('livechat:departments', FlowRouter.getParam('_id'));
		if (sub.ready()) {
			department = LivechatDepartment.findOne({ _id: FlowRouter.getParam('_id') });
			if (department) {
				this.department.set(department);
			}
		}
	});
});
