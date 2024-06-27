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
  RenameScreenAction,
  EditorTabsToggleAction,
  CreateNewProjectAction,
  ActiveProjectAction,
  DuplicateProjectAction,
  DeleteProjectAction,
  RenameProjectAction,
  UpdateFlowEdgesAction,
  UpdateNodesAndViewPortAction,
} from './action';
import getDate from '../utils/getDate';
import { SurfaceOptions } from '../Components/Preview/Display/Surface/constant';
import { filterEdges } from '../utils/filterEdges';

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
  | DeleteScreenAction
  | RenameScreenAction
  | CreateNewProjectAction
  | ActiveProjectAction
  | DuplicateProjectAction
  | DeleteProjectAction
  | RenameProjectAction
  | UpdateFlowEdgesAction
  | UpdateNodesAndViewPortAction;

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
  RenameScreen,
  CreateNewProject,
  ActiveProject,
  DeleteProject,
  DuplicateProject,
  RenameProject,
  UpdateFlowEdges,
  UpdateNodesAndViewPort,
}

const reducer = (state: initialStateType, action: IAction) => {
  const { activeProject, activeScreen } = state;
  switch (action.type) {
    case ActionTypes.IsMobile:
      return { ...state, isMobile: action.payload };
    case ActionTypes.IsTablet:
      return { ...state, isTablet: action.payload };
    case ActionTypes.SidebarToggle:
      return { ...state, sideBarToggle: action.payload };
    case ActionTypes.PreviewToggle:
      return { ...state, previewTabsToggle: action.payload };
    case ActionTypes.EditorToggle:
      return { ...state, editorTabsToggle: action.payload };
    case ActionTypes.TemplatesToggle:
      return { ...state, templatesToggle: action.payload };
    case ActionTypes.NavMenuToggle:
      return { ...state, navMenuToggle: action.payload };
    case ActionTypes.Surface: {
      state.screens[activeScreen].payload.surface = action.payload;
      state.screens[activeScreen].changedByEditor = false;

      return { ...state };
    }
    case ActionTypes.UpdatePayload: {
      state.screens[activeScreen].payload.blocks = action?.payload?.blocks;
      if (action?.payload?.surface)
        state.screens[activeScreen].payload.surface = action?.payload?.surface;
      state.screens[activeScreen].changedByEditor =
        action?.payload?.changedByEditor === undefined;
      state.projects[activeProject].flowEdges = filterEdges(
        state.projects[activeProject].flowEdges,
        action?.payload?.blocks.map((node) => node.actionId),
        activeScreen
      );
      return { ...state };
    }
    case ActionTypes.ActionPreview: {
      state.screens[activeScreen].actionPreview = action.payload;
      return { ...state };
    }
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
            name: action?.payload || 'Untitled Screen',
            payload: {
              surface: SurfaceOptions.Message,
              blocks: [],
            },
            date: getDate(),
            actionPreview: {},
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
            ...state.screens[action.payload.id],
            id,
            date: getDate(),
            actionPreview: {},
            name: action?.payload.name || 'Untitled Screen',
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
    case ActionTypes.RenameScreen: {
      state.screens[action?.payload?.id].name = action.payload.name;
      return { ...state };
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

      state.projects[activeProject].flowEdges = state.projects[
        activeProject
      ].flowEdges.filter(
        (edge) =>
          edge.source !== action.payload && edge.target !== action.payload
      );

      state.projects[activeProject].flowNodes = state.projects[
        activeProject
      ].flowNodes.filter((node) => node.id !== action.payload);

      return { ...state };
    }

    case ActionTypes.CreateNewProject: {
      const activeProjectId = getUniqueId();
      const activeScreenId = getUniqueId();
      return {
        ...state,
        projects: {
          ...state.projects,
          [activeProjectId]: {
            id: activeProjectId,
            name: action?.payload || 'Untitled Project',
            screens: [activeScreenId],
            date: getDate(),
            flowEdges: [],
            flowNodes: [],
          },
        },
        activeProject: activeProjectId,
        screens: {
          ...state.screens,
          [activeScreenId]: {
            id: activeScreenId,
            name: 'Untitled Screen',
            date: getDate(),
            payload: {
              surface: SurfaceOptions.Message,
              blocks: [],
            },
            actionPreview: {},
          },
        },
      };
    }
    case ActionTypes.ActiveProject:
      return {
        ...state,
        activeProject: action.payload,
        activeScreen: state.projects[action.payload].screens[0],
      };

    case ActionTypes.DuplicateProject: {
      const activeProjectId = getUniqueId();
      const screensIds = state.projects[action.payload.id].screens;
      const newScreensIds = screensIds.map(() => getUniqueId());
      const screens = structuredClone(state.screens);
      newScreensIds.forEach((id, index) => {
        screens[id] = {
          ...screens[screensIds[index]],
          date: getDate(),
          id,
        };
      });

      return {
        ...state,
        projects: {
          ...state.projects,
          [activeProjectId]: {
            ...state.projects[action.payload.id],
            id: activeProjectId,
            name: action?.payload.name || 'Untitled Project',
            screens: newScreensIds,
            date: getDate(),
          },
        },
        activeProject: activeProjectId,
        screens: screens,
      };
    }

    case ActionTypes.DeleteProject: {
      window.console.log(state.projects[action.payload]?.screens);
      const screensIds = state.projects[action.payload]?.screens;
      screensIds?.map((id) => delete state.screens[id]);
      delete state.projects[action.payload];
      return {
        ...state,
        activeProject: '',
        activeScreen: '',
      };
    }
    case ActionTypes.RenameProject: {
      state.projects[action.payload.id].name = action.payload.name;
      return { ...state };
    }

    case ActionTypes.UpdateFlowEdges: {
      state.projects[activeProject].flowEdges = action.payload;
      return { ...state };
    }
    case ActionTypes.UpdateNodesAndViewPort: {
      const { nodes, viewport } = action.payload;
      state.projects[activeProject].flowNodes = nodes;
      state.projects[activeProject].viewport = viewport;
      return { ...state };
    }
    default:
      return state;
  }
};

export default reducer;
