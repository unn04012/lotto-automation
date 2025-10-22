import * as Joi from 'joi';

export const dynamodbValidationSchema = Joi.object({
  DYNAMODB_REGION: Joi.string().required(),
  DYNAMODB_ENDPOINT: Joi.string().uri().required(),
});
