RocketChat.ChannelSettingsMailMessages = new class
	addCheckboxes = ->
		$('.messages-box .wrapper .message').each (index, item) ->
			$item = $(item)
			unless $item.find('input[type=checkbox]').length
				$item.prepend(HTML.toHTML(HTML.INPUT({type: 'checkbox', class: 'send-message', style: 'position: absolute; left: 0' })));

	removeCheckboxes = ->
		$('.messages-box .wrapper .message input[type=checkbox].send-message').remove()

	addCheckboxes: addCheckboxes
	removeCheckboxes: removeCheckboxes
