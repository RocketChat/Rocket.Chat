Template.securityBanner.helpers
	bannerData: -> 
		Template.instance().updateBannerData(this.permissions)
		return Template.instance().bannerData.get()


Template.securityBanner.onCreated ->
	self = this
	this.bannerData = new ReactiveVar {text:'Unknown', classificationId : 'U'}

	this.updateBannerData = (accessPermissions) ->
		# ignore undefined/null
		unless accessPermissions
			return

		Meteor.call 'getSecurityBanner', accessPermissions, (error, result) ->
			if error
				console.error error.reason
			else
				self.bannerData.set result