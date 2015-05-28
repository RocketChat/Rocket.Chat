Template.sideNav.helpers
	flexTemplate: ->
		return SideNav.getFlex().template
	flexData: ->
		return SideNav.getFlex().data

Template.sideNav.rendered = ->
	SideNav.init()