import { BaseResponse, BaseResource } from '../../shared/infrastructure/base-response';

/**
 * DTO for a user resource from the API.
 */
export interface UserResource extends BaseResource {
  id: number;
  email: string;
  roles?: string[];
  permissions?: string[];
  token?: string;
}

/**
 * DTO for sign-in response from the API.
 * Backend returns: { id, email, token }
 */
export interface SignInResponse {
  id: number;
  email: string;
  token: string;
  ownerId?: number; // opcional: el id del owner si el backend lo devuelve
}

/**
 * DTO for sign-up response from the API.
 * Backend returns: { id, email, token } - auto-login after registration
 */
export interface SignUpResponse {
  id: number;
  email: string;
  token: string;
  ownerId?: number; // opcional
}

/**
 * @deprecated Use SignInResponse instead
 */
export interface LoginResponse extends BaseResponse {
  user: UserResource;
  token: string;
}

/**
 * @deprecated Use SignUpResponse instead
 */
export interface RegisterResponse extends BaseResponse {
  user: UserResource;
  token: string;
}

