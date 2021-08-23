const absoluteUrl = new RegExp('^http(s)?\:\/\/');

const isAbsoluteLocation = (url) => !!url.match(absoluteUrl);

export { isAbsoluteLocation };
