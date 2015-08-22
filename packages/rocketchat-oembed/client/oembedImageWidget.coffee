Template.oembedImageWidget.helpers
	showImage: ->
		return @downloadImages is true or not Meteor.Device.isPhone()