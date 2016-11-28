/* global ensureFlexPanelTemplate:true, openFlexPanel:true, toggleFlexPanel:true */
/* exported ensureFlexPanelTemplate, openFlexPanel, toggleFlexPanel */

ensureFlexPanelTemplate = () => {
  const tmpl = RocketChat.TabBar.getTemplate()
  if (tmpl !== 'flexPanel') {
    RocketChat.TabBar.setTemplate('flexPanel')
  }
}

openFlexPanel = url => {
  ensureFlexPanelTemplate()
  Session.set('flexPanelIframeURL', url)
  RocketChat.TabBar.openFlex()
}

toggleFlexPanel = url => {
  ensureFlexPanelTemplate()
  if (RocketChat.TabBar.isFlexOpen()) {
    RocketChat.TabBar.closeFlex()
  } else {
    openFlexPanel(url)
  }
}
