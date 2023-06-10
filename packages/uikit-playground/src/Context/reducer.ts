import _ from 'lodash';

import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import getUniqueId from '../utils/getUniqueId';
import type { initialStateType } from './initialState';

type actionType = { type: string, payload?: any };

const reducer = (state: initialStateType, action: actionType) => {
  switch (action.type) {
    case 'isMobile':
      return { ...state, isMobile: action.payload };
    case 'isTablet':
      return { ...state, isTablet: action.payload };
    case 'sidebarToggle':
      return { ...state, sideBarToggle: action.payload };
    case 'previewToggle':
      return { ...state, previewTabsToggle: action.payload };
    case 'editorToggle':
      return { ...state, editorTabsToggle: action.payload };
    case 'templatesToggle':
      return { ...state, templatesToggle: action.payload };
    case 'navMenuToggle':
      return { ...state, navMenuToggle: action.payload };
    case 'surface':
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
    case 'updatePayload':
      return {
        ...state,
        screens: {
          ...state.screens,
          [state.activeScreen]: {
            ...state.screens[state.activeScreen],
            payload: action.payload.payload,
            changedByEditor: action.payload.changedByEditor === undefined,
          },
        },
      };
    case 'actionPreview':
      return { ...state, actionPreview: action.payload };
    case 'user':
      return { ...state, user: action.payload };
    case 'openCreateNewScreen':
      return { ...state, openCreateNewScreen: action.payload };
    case 'activeScreen':
      return {
        ...state,
        screens: _.cloneDeep(state.screens),
        openCreateNewScreen: false,
        activeScreen: action.payload,
      };
    case 'createNewScreen': {
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
    case 'duplicateScreen': {
      const id = getUniqueId();
      return {
        ...state,
        screens: {
          ...state.screens,
          [id]: {
            ...state.screens[action.payload.id],
            id,
            name: action?.payload.name || 'default',
            payload: state.screens[action.payload.id].payload,
            changedByEditor: true,
          },
        },
        activeScreen: id,
      };
    }
    case 'deleteScreen': {
      const screens = _.cloneDeep(state.screens);
      delete screens[action.payload];
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
