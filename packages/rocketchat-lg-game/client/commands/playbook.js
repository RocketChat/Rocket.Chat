/* global commandFuncs, openFlexPanel, */

const PLAYBOOK_URL = 'https://playbook.learnersguild.org/'

commandFuncs.playbook = args => {
  if (!args.help) {
    if (args._.length === 0) {
      openFlexPanel(PLAYBOOK_URL)
    } else {
      openFlexPanel(`${PLAYBOOK_URL}?q=${encodeURIComponent(args._.join(' '))}`)
    }
  }
}
