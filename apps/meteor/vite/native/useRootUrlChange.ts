// The standalone client is served from another origin than the server's Site_Url on purpose, so offering to change
// Site_Url to that origin would point the server at the proxy.
export const useRootUrlChange = (): void => undefined;
