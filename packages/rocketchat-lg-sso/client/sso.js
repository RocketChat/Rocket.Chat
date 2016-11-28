/* global window, document, logger, getServiceBaseURL, IDM */

function loginUsingLearnersGuildJWT(lgJWT, userCallback) {
  const methodArguments = [{lgSSO: true, lgJWT}]

  return Accounts.callLoginMethod({methodArguments, userCallback})
}

function parseUrl(url = window.location.href) {
  const urlParser = document.createElement('a')
  urlParser.href = url
  const attrs = urlParser.search.slice(1).split('&')
  const query = attrs.reduce((last, attr) => {
    if (attr) {
      const [k, v] = attr.split('=')
      return Object.assign({}, last, {[k]: v})
    }
    return last
  }, {})
  return {
    protocol: urlParser.protocol,
    host: urlParser.host,
    pathname: urlParser.pathname,
    hash: urlParser.hash,
    query,
  }
}

function formatUrl(urlObject) {
  const query = Object.keys(urlObject.query).map(key => {
    return `${key}=${urlObject.query[key]}`
  }).join('&')
  const search = query ? `?${query}` : ''
  const url = `${urlObject.protocol}//${urlObject.host}${urlObject.pathname}${search}${urlObject.hash}`
  return url
}

// This is a weird hack. We'll wait until the loginLayout is created, and once
// it has been created, we'll look for our token (which may have been passed
// back to us from the IDM service if we're being redirected back because we
// pass 'responseType=token' to IDM). If we find it, we'll use it to sign-in.
// Otherwise, we'll redirect to IDM passing 'responseType=token'.
Template.loginLayout.created = function () {
  const urlObject = parseUrl(window.location.href)
  const {lgJWT} = urlObject.query
  if (lgJWT) {
    logger.log('lgJWT token found in query string, signing-in')
    /* global history */
    if (history && typeof history.pushState === 'function') {
      const newQuery = Object.assign({}, urlObject.query)
      delete newQuery.lgJWT
      urlObject.query = newQuery
      history.pushState({}, '', formatUrl(urlObject))
    }
    return loginUsingLearnersGuildJWT(lgJWT)
  }
  // differentiate between dev and prod
  const redirect = encodeURIComponent(window.location.href.split(/[?#]/)[0])
  /* global HttpQueryString */
  const {inviteCode} = HttpQueryString.parse(window.location.search.slice(1))
  const authURLQuery = HttpQueryString.stringify({redirect, responseType: 'token'})
  const authURL = inviteCode ? `${getServiceBaseURL(IDM)}/sign-up/${inviteCode}?${authURLQuery}` : `${getServiceBaseURL(IDM)}/sign-in?${authURLQuery}`
  logger.log(`no lgJWT token found in query string, redirecting to ${authURL}`)
  window.location.href = authURL
}

Meteor.startup(() => {
  Accounts.onLoginFailure(() => {
    // if our login fails for any reason, we need to redirect to IDM with an auth error message
    const failureRedirectURL = `${getServiceBaseURL(IDM)}/sign-in?err=auth`
    window.location.href = failureRedirectURL
  })
})

// make sure our lgSSO service data is returned with user object
Meteor.subscribe('lgUserData')
