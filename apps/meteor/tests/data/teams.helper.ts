import { ITeam, TEAM_TYPE } from "@rocket.chat/core-typings"
import { api, request } from "./api-data"

export const createTeam = async (credentials: Record<string, any>, teamName: string, type: TEAM_TYPE): Promise<ITeam> => {
    const response = await request.post(api('teams.create')).set(credentials).send({
        name: teamName,
        type,
    });

    return response.body.team;
};

export const deleteTeam = async (credentials: Record<string, any>, teamName: string): Promise<void> => {
    await request.post(api('teams.delete')).set(credentials).send({
        teamName,
    });
};