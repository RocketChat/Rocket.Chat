import toastr from 'toastr'
Template.adminImportProgress.helpers
	step: ->
		return Template.instance().step.get()
	completed: ->
		return Template.instance().completed.get()
	total: ->
		return Template.instance().total.get()

Template.adminImportProgress.onCreated ->
	instance = @
	@step = new ReactiveVar t('Loading...')
	@completed = new ReactiveVar 0
	@total = new ReactiveVar 0
	@updateProgress = ->
		if FlowRouter.getParam('importer') isnt ''
			Meteor.call 'getImportProgress', FlowRouter.getParam('importer'), (error, progress) ->
				if error
					console.warn 'Error on getting the import progress:', error
					handleError error
					return

				if progress
					if progress.step is 'importer_done'
						toastr.success t(progress.step[0].toUpperCase() + progress.step.slice(1))
						FlowRouter.go '/admin/import'
					else if progress.step is 'importer_import_failed'
						toastr.error t(progress.step[0].toUpperCase() + progress.step.slice(1))
						FlowRouter.go '/admin/import/prepare/' + FlowRouter.getParam('importer')
					else
						instance.step.set t(progress.step[0].toUpperCase() + progress.step.slice(1))
						instance.completed.set progress.count.completed
						instance.total.set progress.count.total
						setTimeout(() ->
							instance.updateProgress()
						, 100)
				else
					toastr.warning t('Importer_not_in_progress')
					FlowRouter.go '/admin/import/prepare/' + FlowRouter.getParam('importer')

	instance.updateProgress()
