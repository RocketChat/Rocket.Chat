export const URL_RE =
    /(?:[A-Za-z0-9+\-.]{1,32}:\/\/|\/\/)[^\s)\]>|]+|[\w\-]+(?:\.[\w\-]+)+(?:\/[^\s)\]>|]*)?/y;

export const EMAIL_RE =
    /(?:mailto:)?[^\s@<>()\[\]|]+@[^\s@<>()\[\]|]+\.[^\s@<>()\[\]|]+/y;

export const PHONE_RE =
    /\+(?:\(?\d+\)?[\s\-]?){1,}\d/y;

export const COLOR_RE =
    /color:#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{3})(?![0-9A-Fa-f])/y;

export const TS_INNER = /([^>]+)/y;

export const TRAIL_PUNCT = /[.,!?;:'"]+$/;
