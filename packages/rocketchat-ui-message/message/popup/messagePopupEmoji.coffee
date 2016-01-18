Template.messagePopupEmoji.helpers
	value: ->
		length = this.data.length
		return this.data[length - 1]
