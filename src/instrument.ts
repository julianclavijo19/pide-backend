import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV || 'development',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env.APP_ENV === 'production' ? 0.2 : 1.0,
  profilesSampleRate: process.env.APP_ENV === 'production' ? 0.2 : 1.0,
  sendDefaultPii: true,
  enabled: !!process.env.SENTRY_DSN,
});
