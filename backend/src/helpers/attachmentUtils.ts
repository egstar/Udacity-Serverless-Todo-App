import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
export interface attachmentData {
	putObject: any,
	uploadUrl: string
}
// TODO: Implement the fileStogare logic
const BucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpire = process.env.SIGNED_URL_EXPIRATION
const targetBucket = new XAWS.S3({ signatureVersion: 'v4' })

export const AttachmentUtils = (attachmentId: string): attachmentData  => {
	let uploadUrl: string
	const putObject = targetBucket.getSignedUrl('putObject', {
		Bucket: BucketName,
		Key: attachmentId,
		Expires: Number(urlExpire)
	})
	if(!putObject) throw new Error('Cannot set url')
	uploadUrl = `https://${BucketName}.s3.amazonaws.com/${attachmentId}`
	return {
		putObject,
		uploadUrl
	}
}

