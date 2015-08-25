Template.securityBanner.helpers
	bannerData: -> 
		return Template.instance().bannerData.get()

	editable: ->
		editable = Template.instance().canEdit || false
		return if editable then 'editable' else ''

Template.securityBanner.onCreated ->
	self = this
	this.canEdit = self.data?.canEdit || false
	self.bannerData = new ReactiveVar {text:'Unknown', classificationId : 'U'}

	self.updateBannerData = (accessPermissions) ->
		# ignore undefined/null
		unless accessPermissions
			return

		Meteor.call 'getSecurityBanner', accessPermissions, (error, result) ->
			if error
				console.error error.reason
			else
				self.bannerData.set result

	# update banner when permissions change
	this.autorun ->
		if self.data.permissions
			self.updateBannerData(self.data.permissions.get())

