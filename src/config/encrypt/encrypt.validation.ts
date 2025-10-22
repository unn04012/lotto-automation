import * as Joi from 'joi';

export const encryptValidationSchema = Joi.object({
  ENCRYPTION_KEY: Joi.string().required(),
  ENCRYPTION_ALGORITHM: Joi.string().required(),
});
