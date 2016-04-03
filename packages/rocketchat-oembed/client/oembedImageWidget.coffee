Template.oembedImageWidget.helpers
	loadImage: ->

		if Meteor.user()?.settings?.preferences?.autoImageLoad is false and this.downloadImages? is not true
			return false

		if Meteor.Device.isPhone() and Meteor.user()?.settings?.preferences?.saveMobileBandwidth and this.downloadImages? is not true
			return false

		return true


	collapsed: ->
		if this.collapsed?
			return this.collapsed
		else
			return Meteor.user()?.settings?.preferences?.collapseMediaByDefault is true
