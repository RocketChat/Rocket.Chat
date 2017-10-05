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
	this.updateProgress = function() {
		if (FlowRouter.getParam('importer') !== '') {
			return Meteor.call('getImportProgress', FlowRouter.getParam('importer'), function(error, progress) {
				if (error) {
					console.warn('Error on getting the import progress:', error);
					handleError(error);
					return;
				}

				if (progress) {
					if (progress.step === 'importer_done') {
						toastr.success(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
						return FlowRouter.go('/admin/import');
					} else if (progress.step === 'importer_import_failed') {
						toastr.error(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
						return FlowRouter.go(`/admin/import/prepare/${ FlowRouter.getParam('importer') }`);
					} else {
						instance.step.set(t(progress.step[0].toUpperCase() + progress.step.slice(1)));
						instance.completed.set(progress.count.completed);
						instance.total.set(progress.count.total);
						return setTimeout(() => instance.updateProgress(), 100);
					}
				} else {
					toastr.warning(t('Importer_not_in_progress'));
					return FlowRouter.go(`/admin/import/prepare/${ FlowRouter.getParam('importer') }`);
				}
			});
		}
	};

	return instance.updateProgress();
});
