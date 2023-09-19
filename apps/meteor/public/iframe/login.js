window.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 'login' && data.loginToken) {
        localStorage.setItem('Meteor.loginToken', data.loginToken);

        window.location.href = window.location.href.replace('/iframeLogin', data.location ?? '/home');
    }
});

window.parent.postMessage({ type: 'pageLoad' }, '*');