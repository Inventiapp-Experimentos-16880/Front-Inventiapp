import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { LoginCredentials } from '../domain/model/login-credentials';
import { RegisterData } from '../domain/model/register-data';
import { UserResource, SignInResponse, SignUpResponse } from './auth-response';
import { AuthAssembler } from './auth-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export class AuthApiEndpoint extends BaseApiEndpoint<User, UserResource, SignInResponse, AuthAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}`, new AuthAssembler());
  }

  /**
   * Authenticates a user with the provided credentials.
   * @param credentials - The login credentials.
   * @returns An Observable of the sign-in response with token.
   * @remarks Uses backend /authentication/sign-in endpoint
   */
  signIn(credentials: LoginCredentials): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(
      `${this.endpointUrl}${environment.platformProviderAuthSignInEndpointPath}`,
      {
        email: credentials.email,
        password: credentials.password
      }
    );
  }

  /**
   * Registers a new user with the provided data.
   * Backend automatically assigns ROLE_ADMIN with all permissions (master user).
   * @param data - The registration data.
   * @returns An Observable of the sign-up response with user info.
   * @remarks Uses backend /authentication/sign-up endpoint
   */
  signUp(data: RegisterData): Observable<SignUpResponse> {
    return this.http.post<SignUpResponse>(
      `${this.endpointUrl}${environment.platformProviderAuthSignUpEndpointPath}`,
      {
        email: data.email,
        password: data.password
      }
    );
  }

  /**
   * Gets user information by ID.
   * @param userId - The user ID.
   * @returns An Observable of the user data with complete information.
   */
  getUserById(userId: string): Observable<UserResource> {
    return this.http.get<UserResource>(
      `${this.endpointUrl}${environment.platformProviderUsersEndpointPath}/${userId}`
    );
  }
}
