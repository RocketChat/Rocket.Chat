import _ from 'lodash';

import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import getUniqueId from '../utils/getUniqueId';
import type { initialStateType } from './initialState';
import {
  IsMobileAction,
  IsTabletAction,
  SidebarToggleAction,
  PreviewTabsToggleAction,
  TemplatesToggleAction,
  NavMenuToggleAction,
  SurfaceAction,
  UpdatePayloadAction,
  ActionPreviewAction,
  UserAction,
  OpenCreateNewScreenAction,
  ActiveScreenAction,
  CreateNewScreenAction,
  DuplicateScreenAction,
  DeleteScreenAction,
  EditorTabsToggleAction,
} from './action';

type IAction =
  | IsMobileAction
  | IsTabletAction
  | SidebarToggleAction
  | PreviewTabsToggleAction
  | EditorTabsToggleAction
  | TemplatesToggleAction
  | NavMenuToggleAction
  | SurfaceAction
  | UpdatePayloadAction
  | ActionPreviewAction
  | UserAction
  | OpenCreateNewScreenAction
  | ActiveScreenAction
  | CreateNewScreenAction
  | DuplicateScreenAction
  | DeleteScreenAction;

export enum ActionTypes {
  IsMobile,
  IsTablet,
  SidebarToggle,
  PreviewToggle,
  EditorToggle,
  TemplatesToggle,
  NavMenuToggle,
  Surface,
  UpdatePayload,
  ActionPreview,
  User,
  OpenCreateNewScreen,
  ActiveScreen,
  CreateNewScreen,
  DuplicateScreen,
  DeleteScreen,
}

const reducer = (state: initialStateType, action: IAction) => {
  const { activeProject, activeScreen } = state;
  switch (action.type) {
    case ActionTypes.IsMobile:
      return { ...state, isMobile: action.payload };
    case ActionTypes.IsTablet:
      return { ...state, isTablet: action.payload };
    case ActionTypes.SidebarToggle:
      return { ...state, sidebarToggle: action.payload };
    case ActionTypes.PreviewToggle:
      return { ...state, previewTabsToggle: action.payload };
    case ActionTypes.EditorToggle:
      return { ...state, editorTabsToggle: action.payload };
    case ActionTypes.TemplatesToggle:
      return { ...state, templatesToggle: action.payload };
    case ActionTypes.NavMenuToggle:
      return { ...state, navMenuToggle: action.payload };
    case ActionTypes.Surface: {
      state.screens[activeScreen].surface = action.payload;
      state.screens[activeScreen].changedByEditor = false;

      return { ...state };
    }
    case ActionTypes.UpdatePayload: {
      state.screens[activeScreen].payload = action?.payload?.payload;
      state.screens[activeScreen].changedByEditor =
        action?.payload?.changedByEditor === undefined;
      return { ...state };
    }
    case ActionTypes.ActionPreview:
      return { ...state, actionPreview: action.payload };
    case ActionTypes.User:
      return { ...state, user: action.payload };
    case ActionTypes.OpenCreateNewScreen:
      return { ...state, openCreateNewScreen: action.payload };
    case ActionTypes.ActiveScreen:
      return {
        ...state,
        openCreateNewScreen: false,
        activeScreen: action.payload,
      };
    case ActionTypes.CreateNewScreen: {
      const id = getUniqueId();
      return {
        ...state,
        screens: {
          ...state.screens,
          [id]: {
            id,
            name: action?.payload || 'default',
            payload: [],
          },
        },
        projects: {
          ...state.projects,
          [activeProject]: {
            ...state.projects[activeProject],
            screens: [...state.projects[activeProject].screens, id],
          },
        },
        openCreateNewScreen: false,
        activeScreen: id,
      };
    }
    case ActionTypes.DuplicateScreen: {
      const id = getUniqueId();
      const screens = state.projects[activeProject].screens;
      screens.splice(screens.indexOf(action.payload.id), 0, id);
      return {
        ...state,
        screens: {
          ...state.screens,
          [id]: {
            id,
            name: action?.payload.name || 'default',
            payload: state.screens[action.payload.id].payload,
          },
        },
        projects: {
          ...state.projects,
          [activeProject]: {
            ...state.projects[activeProject],
            screens,
          },
        },
        openCreateNewScreen: false,
        activeScreen: id,
      };
    }
    case ActionTypes.DeleteScreen: {
      delete state.screens[action.payload];
      state.projects[activeProject].screens = [
        ...state.projects[activeProject].screens.filter(
          (id) => id !== action.payload
        ),
      ];
      if (state.projects[activeProject].screens.length > 0) {
        state.activeScreen = state.projects[activeProject].screens[0];
      } else if (state.projects[activeProject].screens.length === 0) {
        if (Object.keys(state.projects).length > 0) {
          delete state.projects[activeProject];
          state.activeProject = '';
          state.activeScreen = '';
        }
      }
      return { ...state };
    }
    default:
      return state;
  }
};

export default reducer;
