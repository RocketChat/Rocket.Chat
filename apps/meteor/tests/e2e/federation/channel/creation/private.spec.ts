import { test, expect } from '@playwright/test';
import * as constants from '../config/constants'

test.describe.parallel('Federation - Channel Creation', () => {

	test.describe('Group (Private)', () => {

		test.describe('Inviting users using the creation modal', () => {

			test.describe('Create a group inviting an user from the Server B who does not exist in Server A yet', () => {

			});

			test.describe('Create a group inviting an user from the Server B who already exist in Server A', () => {

			});

			test.describe('Create a group inviting an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

			});

			test.describe('Create a group inviting an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

			});

			test.describe('Create a group inviting an user from Server A only (locally)', () => {

			});

		});

		test.describe('Inviting users using the Add Members button', () => {
			test.describe('Create an empty group, and invite an user from the Server B who does not exist in Server A yet', () => {

			});

			test.describe('Create an empty group, and invite an user from the Server B who already exist in Server A', () => {

			});

			test.describe('Create an empty group, and invite an user from the Server B who does not exist in Server A yet + an user from Server A only (locally)', () => {

			});

			test.describe('Create an empty group, and invite an user from the Server B who already exist in Server A + an user from Server A only (locally)', () => {

			});

			test.describe('Create an empty group, and invite an user from Server A only (locally)', () => {

			});
		});
	});

});
