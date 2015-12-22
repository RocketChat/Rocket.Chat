Template.messageAttachment.helpers
	fixCordova: (url) ->
		slash = url.lastIndexOf('/') + 1

		fileName = url.substr slash
		filePath = url.substr 0, slash

		url = filePath + encodeURIComponent fileName

		if Meteor.isCordova and url?[0] is '/'
			return Meteor.absoluteUrl().replace(/\/$/, '') + url
		return url

	showImage: ->
		if Meteor.user()?.settings?.preferences?.autoImageLoad is false and this.downloadImages? is not true
			return false

		if Meteor.Device.isPhone() and Meteor.user()?.settings?.preferences?.saveMobileBandwidth and this.downloadImages? is not true
			return false

		return true

	getImageHeight: (height) ->
		return height or 200
