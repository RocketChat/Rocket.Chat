#  Class for the selection channels for ImporterSelection
Importer.SelectionChannel = class Importer.SelectionChannel
	# Constructs a new selection channel.
	#
	# @param [String] channel_id the unique identifier of the channel
	# @param [String] name the name of the channel
	# @param [Boolean] is_archived whether the channel was archived or not
	# @param [Boolean] do_import whether we will be importing the channel or not
	# @param [Boolean] is_private whether the channel is private or public
	#
	constructor: (@channel_id, @name, @is_archived, @do_import, @is_private) ->
		#TODO: Add some verification?
