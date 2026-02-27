import { registerAs } from '@nestjs/config';

export default registerAs('sentry', () => ({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV || 'development',
}));
