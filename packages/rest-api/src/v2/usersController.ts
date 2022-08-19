import {
	Body,
	Controller,
	Get,
	Path,
	Post,
	Query,
	Route,
	SuccessResponse,
} from "tsoa";
import { IUser } from '@rocket.chat/core-typings';

import { UsersService, UserCreationParams } from "./usersService";

@Route("users")
export class UsersController extends Controller {
	private UserService: any; // TODO missing way to import Service definitions

	constructor(rcDI: any) {
		super();
		this.UserService = rcDI.User;
	}

	@Get("{userId}")
	public async getUser(
		@Path() userId: number,
		@Query() name?: string
	): Promise<IUser> {
		return new UsersService().get(userId, name);
	}

	@Get()
	public async getUsers(
		@Query() name?: string
	): Promise<IUser[]> {
		return new UsersService().getAll(name);
	}

	@SuccessResponse("201", "Created") // Custom success response
	@Post()
	public async createUser(
		@Body() requestBody: UserCreationParams
	): Promise<void> {
		this.setStatus(201); // set return status 201
		new UsersService().create(requestBody);
		return;
	}
}
