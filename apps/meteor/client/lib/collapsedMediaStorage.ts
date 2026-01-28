// Minimal localStorage helper for persisting collapsed media state
export const COLLAPSED_MEDIA_KEY = 'rc:collapsedMedia';

const safeParse = (raw: string | null): Record<string, boolean> => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readMap = (): Record<string, boolean> => safeParse(localStorage.getItem(COLLAPSED_MEDIA_KEY));

const writeMap = (map: Record<string, boolean>): void => {
  try {
    localStorage.setItem(COLLAPSED_MEDIA_KEY, JSON.stringify(map));
  } catch {
    // ignore quota or privacy errors
  }
};

export const isCollapsed = (id?: string): boolean | undefined => {
  if (!id) return undefined;
  const map = readMap();
  if (Object.prototype.hasOwnProperty.call(map, id)) {
    return !!map[id];
  }
  return undefined;
};

export const setCollapsed = (id: string, value: boolean): void => {
  if (!id) return;
  const map = readMap();
  map[id] = !!value;
  writeMap(map);
};

export const clearCollapsed = (id: string): void => {
  if (!id) return;
  const map = readMap();
  if (Object.prototype.hasOwnProperty.call(map, id)) {
    delete map[id];
    writeMap(map);
  }
};

export default {
  isCollapsed,
  setCollapsed,
  clearCollapsed,
};
