import * as db from '../data/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

// TODO: Implement businessLogic

const logger = createLogger('businesslogic')
// #~ Create todo function ~#
export const createTodo = async(userId: string, CreateTodoRequest: CreateTodoRequest): Promise<TodoItem | Error> => {
	const todoId = uuid.v4()
	const Todo: TodoItem = {
		userId,
		todoId,
		createdAt: new Date().toISOString(),
		done: false,
		attachmentUrl: null,
		...CreateTodoRequest
	}
	try {
		await db.createTodo(Todo)
		logger.info(`Create Todo -> `, {
			Todo
		})
		return Todo as TodoItem
	} catch(e) {
		logger.error(`Create Todo -> `, {
			Error: e,
			Todo
		})
		return createError(403, `Unauthorized.`)
	}
}
// #~ Get user todos function ~#
export const getTodos = async(userId: string): Promise<TodoItem[] | Error> => {
	try {
		const userTodos = await db.getTodos(userId)
		logger.info(`getUserTodos ->  `, {
			userTodos
		})
		return userTodos as TodoItem[]
	} catch(e) {
		logger.error(`Get user Todos -> `, {
			Error: e,
			userId
		})
		return createError(403, `Unauthorized.`)
	}
}
// #~ Update todo function ~#
export const updateTodo = async(userId: string, todoId: string, updateRequest: UpdateTodoRequest): Promise<void|Error> => {
	try {
		await db.updateTodo(userId, todoId, updateRequest)
		logger.info(`Update todo -> `, {
			userId,
			todoId,
			updateRequest
		})
	} catch(e) {
		logger.error(`Update todo -> `, {
			Error: e,
			userId,
			todoId,
			updateRequest
		})
		return createError(403, `Unauthorized.`)	
	}
}
// #~ Delete todo function ~#
export const deleteTodo = async(userId: string, todoId: string): Promise<void|Error> => {
	try {
		await db.deleteTodo(userId, todoId)
		logger.info(`Delete todo -> `, {
			userId,
			todoId
		})
	} catch(e) {
		logger.error(`Delete todo -> `, {
			Error: e,
			userId,
			todoId
		})
		return createError(403, `Unauthorized.`)	
	}
}
// #~ Upload todo image function ~#
export const fileUpload = async(userId: string, todoId: string, attachmentId: string): Promise<string|Error> => {
	try {
		const attachmentData = await AttachmentUtils(attachmentId)
		logger.info(`File upload -> Generate URL`, {
			userId,
			todoId,
			attachmentData
		})
		const fileUrl = await db.generateUploadUrl(userId, todoId, attachmentData.uploadUrl)
		logger.info(`File upload -> Database set`, {
			fileUrl,
			userId,
			todoId,
			uploadUrl: attachmentData.uploadUrl
		})
		return attachmentData.putObject
	} catch (e) {
		logger.error(`File upload -> `, {
			Error: e,
			userId,
			todoId
		})
		return createError(403, `Unauthorized.`)	
	}
}