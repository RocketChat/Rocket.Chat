@roomExit = ->
	RocketChat.callbacks.run 'roomExit'

	BlazeLayout.render 'main', {center: 'none'}

	if currentTracker?
		currentTracker.stop()

	mainNode = document.querySelector('.main-content')
	if mainNode?
		for child in mainNode.children
			if child?
				if child.classList.contains('room-container')
					wrapper = child.querySelector('.messages-box > .wrapper')
					if wrapper
						if wrapper.scrollTop >= wrapper.scrollHeight - wrapper.clientHeight
							child.oldScrollTop = 10e10
						else
							child.oldScrollTop = wrapper.scrollTop
				mainNode.removeChild child
