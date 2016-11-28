// This is pretty hacky, but worth it for brand. :-)

const EMOJI_MAPPINGS = {
  echo: 'elephant',
}

function mapEmoji(message) {
  let html = message.html.trim()
  if (html) {
    Object.keys(EMOJI_MAPPINGS).forEach(key => {
      const value = EMOJI_MAPPINGS[key]
      html = html.replace(new RegExp(`:${key}:`, 'g'), `:${value}:`)
    })
    /* global emojione */
    message.html = emojione.toImage(html)
  }
  return message
}

/* eslint-disable prefer-arrow-callback */
if (Meteor.isClient) {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      if (Meteor.user()) {
        RocketChat.callbacks.add('renderMessage', mapEmoji, RocketChat.callbacks.priority.LOW, 'mapEmoji')
      } else {
        RocketChat.callbacks.remove('renderMessage', 'mapEmoji')
      }
    })
  })
}
