import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import toastr from 'toastr';

import { t, handleError, APIClient } from '../../../../../app/utils';
import { hasLicense } from '../../../license/client';
import './livechatUnitForm.html';

const licenseEnabled = new ReactiveVar(false);

hasLicense('livechat-enterprise').then((enabled) => {
	licenseEnabled.set(enabled);
});

const availableDepartments = () => {
	const unit = Template.instance().unit.get();
	const selected = Template.instance().selectedDepartments.get().map((dept) => dept.departmentId);
	const enabledDepartments = Template.instance().availableDepartments.get().filter((dept) => dept.enabled === true);
	let availableDepartments = enabledDepartments;

	if (selected && selected.length) {
		availableDepartments = availableDepartments.filter((dept) => !selected.includes(dept._id));
	}
	if (unit && unit._id) {
		availableDepartments = availableDepartments.filter((dept) => !dept.parentId || dept.parentId === unit._id);
	} else {
		availableDepartments = availableDepartments.filter((dept) => !dept.parentId);
	}
	return availableDepartments;
};

Template.livechatUnitForm.helpers({
	unit() {
		return Template.instance().unit.get();
	},
	monitors() {
		return Template.instance().unit && !_.isEmpty(Template.instance().unit.get()) ? Template.instance().unit.get().monitors : [];
	},
	departments() {
		return Template.instance().unit && !_.isEmpty(Template.instance().unit.get()) ? Template.instance().unit.get().departments : [];
	},
	selectedMonitors() {
		return _.sortBy(Template.instance().selectedMonitors.get(), 'username');
	},
	monitorsBeingSelected() {
		return _.sortBy(Template.instance().monitorsBeingSelected.get(), 'username');
	},
	selectedDepartments() {
		return _.sortBy(Template.instance().selectedDepartments.get(), 'name');
	},
	availableDepartments,
	hasAvailableDepartments() {
		return availableDepartments().length > 0;
	},
	monitorAutocompleteExceptions() {
		return _.pluck(Template.instance().selectedMonitors.get(), 'username').concat(_.pluck(Template.instance().monitorsBeingSelected.get(), 'username'));
	},
	monitorModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${
				f.length === 0
					? text
					: text.replace(
						new RegExp(filter.get()),
						(part) => `<strong>${ part }</strong>`,
					)
			}`;
		};
	},
	onSelectMonitors() {
		return Template.instance().onSelectMonitors;
	},
	availableMonitors() {
		return Template.instance().availableMonitors.get();
	},
	onClickTagMonitors() {
		return Template.instance().onClickTagMonitors;
	},
	hasLicense() {
		return licenseEnabled.get();
	},
});

Template.livechatUnitForm.events({
	'submit #unit-form'(e, instance) {
		e.preventDefault();
		const $btn = instance.$('button.save');

		const _id = $(e.currentTarget).data('id');
		const visibility = instance.$('input[name=visibility]:checked').val();
		const name = instance.$('input[name=name]').val();

		if (visibility !== 'private' && visibility !== 'public') {
			return toastr.error(t('Please_select_visibility'));
		}

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		const oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		const unitData = {
			visibility,
			name: name.trim(),
		};

		const unitMonitors = [];

		instance.selectedMonitors.get().forEach((monitor) => {
			unitMonitors.push(monitor);
		});

		const unitDepartments = [];
		instance.selectedDepartments.get().forEach((department) => {
			unitDepartments.push(department);
		});

		Meteor.call('livechat:saveUnit', _id, unitData, unitMonitors, unitDepartments, function(error/* , result*/) {
			$btn.html(oldBtnValue);
			if (error) {
				return handleError(error);
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-units');
		});
	},

	async 'click .add-monitor'(e, instance) {
		e.preventDefault();

		const monitors = instance.monitorsBeingSelected.curValue;
		if (!monitors.length) {
			return toastr.error(t('Please_fill_a_username'));
		}

		try {
			const newMonitorList = [];
			const selectedMonitors = instance.selectedMonitors.get();

			for (const monitor of monitors) {
				const monitorData = await APIClient.v1.get(`livechat/monitors.getOne?username=${monitor.username}`); //eslint-disable-line
				if (!monitorData || !monitorData._id) {
					toastr.error(t('The_selected_user_is_not_a_monitor'));
					newMonitorList.push(monitor);
					continue;
				}

				const monitorId = monitorData._id;

				for (const oldMonitor of selectedMonitors) {
					if (oldMonitor.monitorId === monitorId) {
						toastr.error(t('This_monitor_was_already_selected'));
						newMonitorList.push(monitor);
						continue;
					}
				}

				const newMonitor = _.clone(monitorData);
				newMonitor.monitorId = monitorId;
				delete newMonitor._id;
				selectedMonitors.push(newMonitor);
			}

			instance.selectedMonitors.set(selectedMonitors);
			instance.monitorsBeingSelected.set(newMonitorList);
		} catch (e) {
			console.error(e);
			return toastr.error(t('Failed_to_add_monitor'));
		}
	},

	'click button.back'(e/* , instance*/) {
		e.preventDefault();
		FlowRouter.go('livechat-units');
	},

	'click .remove-monitor'(e, instance) {
		e.preventDefault();

		let selectedMonitors = instance.selectedMonitors.get();
		selectedMonitors = _.reject(selectedMonitors, (monitor) => monitor.monitorId === this.monitorId);
		instance.selectedMonitors.set(selectedMonitors);
	},

	'click .remove-department'(e, instance) {
		e.preventDefault();

		let selectedDepartments = instance.selectedDepartments.get();
		selectedDepartments = _.reject(selectedDepartments, (department) => department.departmentId === this.departmentId);
		instance.selectedDepartments.set(selectedDepartments);
	},

	'click .available-departments li'(e, instance) {
		const selectedDepartments = instance.selectedDepartments.get();
		const department = _.clone(this);
		department.departmentId = this._id;
		delete department._id;
		selectedDepartments.push(department);
		instance.selectedDepartments.set(selectedDepartments);
	},
});

Template.livechatUnitForm.onCreated(function() {
	this.unit = new ReactiveVar({ enabled: true });
	this.selectedMonitors = new ReactiveVar([]);
	this.monitorsBeingSelected = new ReactiveVar([]);
	this.selectedDepartments = new ReactiveVar([]);
	this.availableDepartments = new ReactiveVar([]);

	this.onSelectMonitors = ({ item: monitor }) => {
		this.monitorsBeingSelected.set([...this.monitorsBeingSelected.curValue, monitor]);
	};

	this.onClickTagMonitors = ({ username }) => {
		this.monitorsBeingSelected.set(this.monitorsBeingSelected.curValue.filter((user) => user.username !== username));
	};

	this.autorun(async () => {
		const id = FlowRouter.getParam('_id');
		const { departments } = await APIClient.v1.get('livechat/department');
		this.availableDepartments.set(departments);
		if (id) {
			const unit = await APIClient.v1.get(`livechat/units.getOne?unitId=${ id }`);
			this.unit.set(unit);
			const { monitors } = await APIClient.v1.get(`livechat/unitMonitors.list?unitId=${ id }`);
			const newSelectedDepartments = [];
			const newSelectedMonitors = [];
			monitors.filter((monitor) => monitor.unitId === unit._id).forEach((monitor) => {
				newSelectedMonitors.push(monitor);
			});
			departments.filter((dept) => dept.parentId === unit._id).forEach((department) => {
				const newDepartment = {
					departmentId: department._id,
					name: department.name,
				};
				newSelectedDepartments.push(newDepartment);
			});
			this.selectedMonitors.set(newSelectedMonitors);
			this.selectedDepartments.set(newSelectedDepartments);
		}
	});
});
