import type { LayoutBlock } from '@rocket.chat/ui-kit';

import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import getUniqueId from '../utils/getUniqueId';

export type docType = {
  payload: readonly LayoutBlock[];
  id: string;
  name: string;
  surface: SurfaceOptions;
  changedByEditor?: boolean;
};

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
  [key: string]: docType
}

export type initialStateType = {
  isMobile: boolean;
  isTablet: boolean;
  sideBarToggle: boolean;
  templatesToggle: boolean,
  previewTabsToggle: number;
  editorTabsToggle: number;
  navMenuToggle: boolean;
  activeScreen: string;
  screens: ScreensType;
  actionPreview: actionPreviewType;
  openCreateNewScreen: boolean;
  user: userType;
};

const initialPageId = getUniqueId();

export const initialState: initialStateType = {
  isMobile: false,
  isTablet: false,
  sideBarToggle: false,
  templatesToggle: false,
  previewTabsToggle: 0,
  editorTabsToggle: 0,
  navMenuToggle: false,
  screens: {[initialPageId] : { id: initialPageId, name: 'default1', payload: [], surface: SurfaceOptions.Message, changedByEditor: true },
},
  activeScreen: initialPageId,
  actionPreview: {},
  openCreateNewScreen: false,
  user: null,
};
