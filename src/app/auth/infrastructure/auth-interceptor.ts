import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtTokenService } from './jwt-token';

/**
 * HTTP Interceptor for adding JWT token to requests.
 * @remarks
 * This interceptor automatically adds the Authorization header with the JWT token
 * to all outgoing HTTP requests, except for login and register endpoints.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(JwtTokenService);
  const token = tokenService.getToken();

  // Skip adding token for login and register requests
  if (req.url.includes('/login') || req.url.includes('/register')) {
    return next(req);
  }

  // Add token to request if available and not expired
  if (token && !tokenService.isTokenExpired()) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
