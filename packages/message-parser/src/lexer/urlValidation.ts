import { parse as tldParse } from 'tldts';

export function isValidAutolinkCandidate(src: string, customDomains: string[] = []): boolean {
    const validHosts = ['localhost', ...customDomains];
    const { isIcann, isIp, isPrivate, domain } = tldParse(src, {
        detectIp: true,
        allowPrivateDomains: true,
        validHosts,
    });

    return Boolean(isIcann || isIp || isPrivate || (domain && validHosts.includes(domain)));
}

export function isValidAutoEmailCandidate(src: string): boolean {
    const href = src.startsWith('mailto:') ? src : `mailto:${src}`;
    const { isIcann, isIp, isPrivate } = tldParse(href, {
        detectIp: false,
        allowPrivateDomains: true,
    });

    return Boolean(isIcann || isIp || isPrivate);
}
