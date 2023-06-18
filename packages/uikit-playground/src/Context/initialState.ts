import type { LayoutBlock } from '@rocket.chat/ui-kit';

import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import getUniqueId from '../utils/getUniqueId';

export type idType = string;

export type userType = {
  id: string;
  username: string;
  name: string;
  team_id: string;
} | null;

export type actionPreviewType = {
  type?: string;
  user?: userType | null;
  api_app_id?: string;
  token?: string;
  container?: {
    type: string;
    text: string;
  };
  trigger_id?: string;
  team?: {
    id: string;
    domain: string;
  } | null;
  enterprise?: string | null;
  is_enterprise_install?: boolean;
  action?: object;
  response_url?: string;
  state?: object;
  view?: readonly LayoutBlock[];
};

export type ScreensType = {
  [key: idType]: {
    payload: readonly LayoutBlock[];
    id: idType;
    name: string;
    surface: SurfaceOptions;
    actionPreview: actionPreviewType;
    changedByEditor?: boolean;
  };
};

export type ProjectsType = {
  [key: idType]: { id: idType; name: string; screens: idType[] };
};

export type initialStateType = {
  isMobile: boolean;
  isTablet: boolean;
  sideBarToggle: boolean;
  templatesToggle: boolean;
  previewTabsToggle: number;
  editorTabsToggle: number;
  navMenuToggle: boolean;
  projects: ProjectsType;
  screens: ScreensType;
  activeProject: string;
  activeScreen: string;
  openCreateNewScreen: boolean;
  user: userType;
};

const initialProjectId = getUniqueId();
const initialScreenId = getUniqueId();

export const initialState: initialStateType = {
  isMobile: false,
  isTablet: false,
  sideBarToggle: false,
  templatesToggle: false,
  previewTabsToggle: 0,
  editorTabsToggle: 0,
  navMenuToggle: false,
  activeProject: initialProjectId,
  activeScreen: initialScreenId,
  openCreateNewScreen: false,
  projects: {
    [initialProjectId]: {
      id: initialProjectId,
      name: 'Project1',
      screens: [initialScreenId],
    },
  },
  screens: {
    [initialScreenId]: {
      payload: [],
      id: initialScreenId,
      name: 'Screen1',
      surface: SurfaceOptions.Message,
      actionPreview: {},
    },
  },
  user: null,
};
