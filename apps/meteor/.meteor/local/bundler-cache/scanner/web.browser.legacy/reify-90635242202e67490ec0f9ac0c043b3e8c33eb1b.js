module.export({parseStringToIceServer:function(){return parseStringToIceServer},parseStringToIceServers:function(){return parseStringToIceServers}},true);const parseStringToIceServer = (server) => {
    const credentials = server.trim().split('@');
    const urls = credentials.pop();
    const [username, credential] = credentials.length === 1 ? credentials[0].split(':') : [];
    return Object.assign({ urls }, (username &&
        credential && {
        username: decodeURIComponent(username),
        credential: decodeURIComponent(credential),
    }));
};
const parseStringToIceServers = (string) => {
    const lines = string.trim() ? string.split(',') : [];
    return lines.map((line) => parseStringToIceServer(line));
};
//# sourceMappingURL=parseStringToIceServers.js.map