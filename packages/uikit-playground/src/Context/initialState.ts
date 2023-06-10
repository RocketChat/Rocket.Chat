import type { LayoutBlock } from '@rocket.chat/ui-kit';

export type docType = {
  payload: readonly LayoutBlock[];
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

export type initialStateType = {
  isMobile: boolean;
  isTablet: boolean;
  sideBarToggle: boolean;
  templatesToggle: boolean,
  previewTabsToggle: number;
  editorTabsToggle: number;
  navMenuToggle: boolean;
  surface: number;
  doc: docType;
  actionPreview: actionPreviewType;
  user: userType;
};

export const initialState: initialStateType = {
  isMobile: false,
  isTablet: false,
  sideBarToggle: false,
  templatesToggle: false,
  previewTabsToggle: 0,
  editorTabsToggle: 0,
  navMenuToggle: false,
  surface: 1,
  doc: { payload: [], changedByEditor: true },
  actionPreview: {},
  user: null,
};
