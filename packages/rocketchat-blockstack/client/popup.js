/* globals cordova */

const openPopup = (url, width=490, height=600) => {
  if (typeof cordova !== 'undefined' && typeof cordova.InAppBrowser !== 'undefined') {
    return _openCordovaPopup(url)
  }
  return _openWindowPopup(url, width, height)
}

const _openWindowPopup = (url, width, height) => {
  const screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft
  const screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop
  const outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth
  const outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.body.clientHeight - 22)
  const left = screenX + (outerWidth - width) / 2
  const top = screenY + (outerHeight - height) / 2
  const features = (`width=${ width },height=${ height },left=${ left },top=${ top },scrollbars=yes`)
  let popup = window.open(url, 'Login', features)
  if (popup.focus) popup.focus()
  return popup
}

const _openCordovaPopup = (url) => {
  let popup = cordova.InAppBrowser.open(url, '_blank')
  popup.closed = false
  const intervalId = setInterval(function() {
    popup.executeScript({
      'code': 'document.getElementsByTagName("script")[0].textContent'
    }, function (data) {
      if (data && data.length > 0 && data[0] === 'window.close()') {
        popup.close()
        popup.closed = true
      }
    })
  }, 100)
  popup.addEventListener('exit', () => clearInterval(intervalId))
  return popup
}

export {
  openPopup
}
