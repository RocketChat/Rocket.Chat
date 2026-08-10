const LAME_MAJOR_VERSION = 3;

const LAME_MINOR_VERSION = 98;

const LAME_PATCH_VERSION = 4;

export function getLameShortVersion() {
  return `${LAME_MAJOR_VERSION}.${LAME_MINOR_VERSION}.${LAME_PATCH_VERSION}` as const;
}
