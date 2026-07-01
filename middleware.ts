import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Exclude: api, _next, _vercel, static files, and app-specific paths
  matcher: ['/((?!api|_next|_vercel|ticket|verify|scanner|admin|ceremony|.*\\..*).*)'  ]
};
