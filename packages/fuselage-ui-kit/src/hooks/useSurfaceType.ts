import { useContext } from "react";
import { SurfaceContext, SurfaceContextValue } from "../contexts/SurfaceContext";

export const useSurfaceType = (): SurfaceContextValue =>
  useContext(SurfaceContext);
