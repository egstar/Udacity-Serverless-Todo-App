import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

const dbTable = process.env.TODOS_TABLE
const secondaryIndex = process.env.TODOS_INDEX
const docClient: DocumentClient= new XAWS.DynamoDB.DocumentClient()
//######### Check todo if exists before database Update,delete #################
export const ifExists = async(userId: string, todoId: string): Promise<unknown> => {
	const todoItem = await docClient.get({
		TableName: dbTable,
		Key: {
			userId,
			todoId
		}
	}).promise()
	if(todoItem)
		logger.info(`${todoId} has been found`)
	return !!todoItem.Item
}
//######### Generate Upload #URL and update DynamoDB with new #URL #################
export const generateUploadUrl = async(userId: string, todoId: string, attachmentUrl: string): Promise<void> => {
	if(!ifExists(userId,todoId)){
		logger.info(`Generate image URL -> Invalid todoId`, {
			todoId,
			userId,
			attachmentUrl
		})
		throw new Error(`Invalid todo`)
	}
	const DatabaseSet = await docClient.update({
		TableName: dbTable,
		Key: {
			userId,
			todoId
		},
		UpdateExpression: 'set attachmentUrl = :attachmentUrl',
		ExpressionAttributeValues: {
			':attachmentUrl': attachmentUrl
		}
	}).promise()
	logger.info('generateUploadUrl -> ', {
		userId,
		todoId,
		attachmentUrl,
		DatabaseSet
	})
	
}
//######### Create a new todo #################
export const createTodo = async(todoItem: TodoItem): Promise<TodoItem> => {	
	await docClient.put({
		TableName: dbTable,
		Item: todoItem
	}).promise()
	logger.info('Create Todo-> ',{
		todoItem
	})
	return todoItem
}
//######### Get todos by Userindex #################
export const getTodos = async(userId: string): Promise<TodoItem[]> => {
	const Query = await docClient.query({
		TableName: dbTable,
		IndexName: secondaryIndex,
		KeyConditionExpression: 'userId = :userId',
		ExpressionAttributeValues: {
			':userId': userId
		}
	}).promise()
	if(!Query) throw new Error(`Failed, try again!`)
	const todosList = Query.Items
	logger.info(`Get user todods ->`, {
		todos: todosList as TodoItem[]
	})
	return todosList as TodoItem[]
}
//######### Delete todo #################
export const deleteTodo = async(userId: string, todoId: string): Promise<void> =>{
	if(!ifExists(userId,todoId)){
		logger.info(`Delete todo -> Invalid todoId`, {
			todoId
		})
		throw new Error(`Invalid todo`)
	}
	await docClient.delete({
		TableName: dbTable,
		Key: {
			userId,
			todoId
		}
	}).promise()
	logger.info(`Delete todo -> `,{
		todoId
	})
}
//######### Update todo #################
export const updateTodo = async(userId: string, todoId: string, todosUpdate: TodoUpdate): Promise<void> => {
	if(!ifExists(userId,todoId)){
		logger.info(`Update todo -> Invalid todoId`, {
			todoId
		})
		throw new Error(`Invalid todo`)
	}
	const updatedTodo = await docClient.update({
		TableName: dbTable,
		Key: {
			userId,
			todoId
		},
		UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
		ExpressionAttributeNames: {
			'#name': 'name'
		},
		ExpressionAttributeValues: {
			':name': todosUpdate.name,
			':dueDate': todosUpdate.dueDate,
			':done': todosUpdate.done
		}
	}).promise()
	logger.info(`Update todo -> `, {
		updatedTodo
	})
	return
}