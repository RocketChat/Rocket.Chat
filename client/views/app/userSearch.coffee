# This template is used for populating the list of users that appear in the drop-down menu while
# using the auto-complete form when labeling a room in the left panel. The data context given
# to this template is a single user document as obtained by the meteor-autocomplete module
# configured in another template.
#
# Given that user document, obtain the current list of selected security labels (Session var) and
# query the server to find out if the user can access all of those labels. If not, apply a special
# style to the list element in order to indicate to the user that there is a problem.
Template.userSearch.onCreated ->
	instance = this

	# Tracker.autorun function that gets executed on template creation, and then re-executed
	# on changes to the reactive inputs (in this case, a session variable). If the
	# 'selectedLabelIds' variable is ever changed, this function will call the server-side
	# 'canAccessResource' method to determine if the user in question can access the labels
	# in that list. If not, the entry is styled differently to indicate a conflict.
	#
	# Since function is tied to Template instance, will automatically stop on template
	# destroy (http://docs.meteor.com/#/full/template_autorun).
	instance.autorun (c) ->
		# get the current list of selected labels
		selectedLabelIds = Session.get('selectedLabelIds') or []
		user = instance.data.username
		# only call server if there are labels to check against
		if selectedLabelIds.length > 0
			Meteor.call 'canAccessResource', [Meteor.user().username, user], selectedLabelIds, (error, result) ->
				if not error
					# entries in the list have the 'user-search-entry' class - see 'userSearch.html'
					$('.user-search-entry').each ->
						# find the correct entry in the list and set/remove the style accordingly
						if $(this).text().trim() is user
							if result.canAccess
								$(this).removeAttr 'style'
							else
								$(this).css 'color', 'red'
							# already found the right element, exit early
							return false