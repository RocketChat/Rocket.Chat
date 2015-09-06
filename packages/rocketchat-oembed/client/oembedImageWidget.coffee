Template.oembedImageWidget.helpers
	showImage: ->

		if Meteor.user()?.settings?.preferences?.autoImageLoad is false
			return false

		if Meteor.Device.isPhone() and Meteor.user()?.settings?.preferences?.saveMobileBandwidth
			return false

		return true
