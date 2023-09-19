window.addEventListener('message', function (event) {
    /**
     * @type data.event {string}
     * @type data.loginToken {string}
     * @type data.path {string}
     */
    const data = event.data;
    if (data.event === 'login-with-token' && data.loginToken) {
        localStorage.setItem('Meteor.loginToken', data.loginToken);

        window.location.href = window.location.href.replace('/iframeLogin', data.path ?? '/home');
    }
});

window.parent.postMessage({ type: 'pageLoad' }, '*');