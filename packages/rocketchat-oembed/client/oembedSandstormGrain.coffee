Template.oembedSandstormGrain.helpers
	token: ->
		return @meta.sandstorm.grain.token
	appTitle: ->
		return @meta.sandstorm.grain.appTitle.defaultText
	grainTitle: ->
		return @meta.sandstorm.grain.grainTitle
	appIconUrl: ->
		return @meta.sandstorm.grain.appIconUrl
window.sandstormOembed = (e) ->
	e = e or window.event
	src = e.target or e.srcElement
	token = src.getAttribute "data-token"
	Meteor.call "sandstormOffer", token
