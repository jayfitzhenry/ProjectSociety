// Registers every HTTP route with the Functions host. Handlers live in src/handlers so tests can use them directly.
import { app } from '@azure/functions';
import { methods } from '../lib/http.js';
import { ROUTES } from '../routes.js';

for (const { name, route, map } of ROUTES) {
  app.http(name, {
    route,
    methods: Object.keys(map),
    authLevel: 'anonymous', // Static Web Apps does the sign-in; staticwebapp.config.json requires it for /api/*.
    handler: methods(map),
  });
}
