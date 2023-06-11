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
      case ActionTypes.Surface:
        return {
          ...state,
          screens: {
            ...state.screens,
            [state.activeScreen]: {
              ...state.screens[state.activeScreen],
              surface: action.payload,
              changedByEditor: false,
            },
          },
        };
      case ActionTypes.UpdatePayload:
        return {
          ...state,
          screens: {
            ...state.screens,
            [state.activeScreen]: {
              ...state.screens[state.activeScreen],
              payload: action?.payload?.payload,
              changedByEditor: action?.payload?.changedByEditor === undefined,
            },
          },
        };
      case ActionTypes.ActionPreview:
        return { ...state, actionPreview: action.payload };
      case ActionTypes.User:
        return { ...state, user: action.payload };
      case ActionTypes.OpenCreateNewScreen:
        return { ...state, openCreateNewScreen: action.payload };
      case ActionTypes.ActiveScreen:
        return {
          ...state,
          screens: _.cloneDeep(state.screens),
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
              surface: SurfaceOptions.Message,
              name: action?.payload || 'default',
              payload: [],
              changedByEditor: true,
            },
          },
          openCreateNewScreen: false,
          activeScreen: id,
        };
      }
      case ActionTypes.DuplicateScreen: {
        const id = getUniqueId();
        return {
          ...state,
          screens: {
            ...state.screens,
            [id]: {
              ...state.screens[action.payload.id],
              id,
              name: action?.payload.name || 'default',
              payload: state.screens[action?.payload?.id].payload,
              changedByEditor: true,
            },
          },
          openCreateNewScreen: false,
          activeScreen: id,
        };
      }
      case ActionTypes.DeleteScreen: {
        const screens = _.cloneDeep(state.screens);
        delete screens[action?.payload];
        if (state.activeScreen === action.payload) {
          return {
            ...state,
            screens,
            activeScreen: Object.keys(screens)[0],
          };
        }
        return {
          ...state,
          screens,
        };
      }
      default:
        return state;
    }
  };
  
  export default reducer;
