import { Importers, ImporterWebsocketReceiver, ProgressStep } from 'meteor/rocketchat:importer';

import toastr from 'toastr';

Template.adminImportProgress.helpers({
	step() {
		return Template.instance().step.get();
	},
	completed() {
		return Template.instance().completed.get();
	},
	total() {
		return Template.instance().total.get();
	}
});

Template.adminImportProgress.onCreated(function() {
	const instance = this;
	this.step = new ReactiveVar(t('Loading...'));
	this.completed = new ReactiveVar(0);
	this.total = new ReactiveVar(0);

	// Ensure there is an importer how they're accessing it
	const key = FlowRouter.getParam('importer').toLowerCase();
	if (key === '' || !Importers.get(key)) {
		FlowRouter.go('/admin/import');
		return;
	}

	function _updateProgress(progress) {
		switch (progress.step) {
			case ProgressStep.DONE:
				toastr.success(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
				return FlowRouter.go('/admin/import');
			case ProgressStep.ERROR:
				toastr.error(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
				return FlowRouter.go(`/admin/import/prepare/${ key }`);
			default:
				instance.step.set(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
				instance.completed.set(progress.count.completed);
				instance.total.set(progress.count.total);
				break;
		}
	}

	this.progressUpdated = function _progressUpdated(progress) {
		if (progress.key.toLowerCase() !== key) {
			return;
		}

		_updateProgress(progress);
	};

	Meteor.call('getImportProgress', key, function(error, progress) {
		if (error) {
			console.warn('Error on getting the import progress:', error);
			handleError(error);
			return FlowRouter.go('/admin/import');
		}

		if (!progress) {
			toastr.warning(t('Importer_not_in_progress'));
			return FlowRouter.go(`/admin/import/prepare/${ key }`);
		}

		const whereTo = _updateProgress(progress);

		if (!whereTo) {
			ImporterWebsocketReceiver.registerCallback(instance.progressUpdated);
		}
	});
});

Template.adminImportProgress.onDestroyed(function() {
	const instance = this;

	ImporterWebsocketReceiver.unregisterCallback(instance.progressUpdated);
});
