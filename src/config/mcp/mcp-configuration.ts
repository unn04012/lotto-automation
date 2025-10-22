import { registerAs } from '@nestjs/config';

export default registerAs('lotto', () => ({
  id: process.env.LOTTO_ID,
  password: process.env.LOTTO_PASSWORD,
}));
