// /apps/meteor/tests/unit/app/livechat/server/helpers/testHelper.ts

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import express from 'express';
import http from 'http';
import { Random } from 'meteor/random';
import { Users } from '@rocket.chat/models';

/**
 * Inicializa um servidor HTTP para os testes.
 * O servidor utiliza um app Express que "monta" os middlewares do Meteor (WebApp.connectHandlers),
 * onde os endpoints REST já devem ter sido registrados (ex.: em rooms.ts).
 */
export async function setupServer(): Promise<http.Server> {
	// Cria uma instância do Express
	const app = express();

	// Monta os handlers do Meteor (os endpoints REST)
	app.use(WebApp.connectHandlers);

	// Cria um servidor HTTP a partir do app Express
	const server = http.createServer(app);

	// Escuta em uma porta disponível (porta 0 indica porta dinâmica)
	await new Promise<void>((resolve) => server.listen(0, resolve));

	return server;
}

/**
 * Cria um usuário de teste com as permissões especificadas.
 * Esse usuário será inserido na coleção de usuários e retornará um objeto contendo
 * o userId e um authToken (gerado aleatoriamente) para simular a autenticação via REST.
 */
export async function createTestUser(options: { permissions: string[] }): Promise<{ userId: string; authToken: string }> {
	// Gera um id e um token aleatórios
	const userId = Random.id();
	const authToken = Random.secret();

	// Insere o usuário na coleção Users com os campos obrigatórios
	await Users.insertOne({
		_id: userId,
		username: `test_user_${userId}`,
		roles: options.permissions,
		createdAt: new Date(),
		type: 'user',
		active: true,
		name: `Test User ${userId}`,
		nickname: `TestUser`,
		services: {}, // pode ser um objeto vazio para fins de teste
		emails: [],   // array vazio de emails
		statusConnection: 'offline'
	});

	return { userId, authToken };
}