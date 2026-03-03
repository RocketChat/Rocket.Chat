export type UrlOptions = {
  siteRootUrl?: string;
};

export function translateUrl(
  url: string,
  newSchemeBase: 'ws' | 'wss',
  subPath: string,
  options: UrlOptions = {}
): string {
  let processedUrl = url;
  
  if (processedUrl.startsWith("/")) {
    const root = options.siteRootUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    processedUrl = `${root}${processedUrl}`;
  }

  // We keep matching the legacy DDP URL pattern in case the parent DDP client still uses it
  const ddpUrlMatch = processedUrl.match(/^ddp(i?)\+sockjs:\/\//);
  const httpUrlMatch = processedUrl.match(/^http(s?):\/\//);
  let newScheme: string;

  if (ddpUrlMatch) {
    const urlAfterDDP = processedUrl.substring(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === 'i' ? newSchemeBase : `${newSchemeBase}s`;
    
    const slashPos = urlAfterDDP.indexOf('/');
    let host = slashPos === -1 ? urlAfterDDP : urlAfterDDP.substring(0, slashPos);
    const rest = slashPos === -1 ? '' : urlAfterDDP.substring(slashPos);

    host = host.replace(/\*/g, () => Math.floor(Math.random() * 10).toString());

    return `${newScheme}://${host}${rest}`;
  } else if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : `${newSchemeBase}s`;
    const urlAfterHttp = processedUrl.substring(httpUrlMatch[0].length);
    processedUrl = `${newScheme}://${urlAfterHttp}`;
  }

  if (processedUrl.indexOf('://') === -1 && !processedUrl.startsWith('/')) {
    processedUrl = `${newSchemeBase}://${processedUrl}`;
  }

  return processedUrl.endsWith('/') ? `${processedUrl}${subPath}` : `${processedUrl}/${subPath}`;
}

export function toWebsocketUrl(url: string, options?: UrlOptions): string {
  return translateUrl(url, 'ws', 'websocket', options);
}