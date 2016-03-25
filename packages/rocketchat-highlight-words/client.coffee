###
# Hilights is a named function that will process Highlights
# @param {Object} message - The message object
###

class HighlightWordsClient
  constructor: (message) ->
    msg = message

    if not _.isString message
      if _.trim message.html
        msg = message.html
      else
        return message

    to_highlight = Meteor.user()?.settings?.preferences?['highlights']

    _.forEach to_highlight, (highlight) ->
      if not _.isBlank(highlight)
        msg = msg.replace(new RegExp("(^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(#{s.escapeRegExp(highlight)})($|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(?![^<]*>|[^<>]*<\\/)", 'gmi'), '$1<span class="highlight-text">$2</span>$3')

    message.html = msg
    return message

RocketChat.callbacks.add 'renderMessage', HighlightWordsClient
