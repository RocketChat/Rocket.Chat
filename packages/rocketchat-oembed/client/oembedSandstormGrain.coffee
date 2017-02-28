Template.oembedSandstormGrain.helpers
	token: ->
		return @meta.sandstorm.grain.token
	appTitle: ->
		return @meta.sandstorm.grain.appTitle.defaultText
	grainTitle: ->
		return @meta.sandstorm.grain.grainTitle
	appIconUrl: ->
		return @meta.sandstorm.grain.appIconUrl
	descriptor: ->
		return @meta.sandstorm.grain.descriptor
window.sandstormOembed = (e) ->
	e = e or window.event
	src = e.target or e.srcElement
	token = src.getAttribute "data-token"
	descriptor = src.getAttribute "data-descriptor"
	Meteor.call "sandstormOffer", token, descriptor
