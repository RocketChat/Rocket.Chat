Template.flexPanel.helpers({
  iframeData() {
    const iframeURL = Session.get('flexPanelIframeURL')
    return {iframeURL}
  }
})

const closeOnWindowMessages = [
  'updateUser',
  'closeCycleVotingResults',
  'closeRetroSurvey',
]

Template.flexPanelIframe.created = function () {
  /* global window */
  window.addEventListener('message', e => {
    const message = e.data
    if (closeOnWindowMessages.indexOf(message) >= 0) {
      RocketChat.TabBar.closeFlex()
    }
  })
}
