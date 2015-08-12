Template.securityBanner.helpers
	bannerData: -> 
		return Template.instance().bannerData.get()


Template.securityBanner.onCreated ->
	self = this
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
		self.updateBannerData(self.data.permissions.get())

