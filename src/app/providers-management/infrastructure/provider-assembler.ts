import {BaseAssembler} from '../../shared/infrastructure/base-assembler';
import {Provider} from '../../inventory/domain/model/provider.entity';
import {ProviderResource, ProviderResponse} from './provider-response';

export class ProviderAssembler implements BaseAssembler<Provider, ProviderResource, ProviderResponse> {

  toEntityFromResource(resource: ProviderResource): Provider {
    return new Provider({
      id: String(resource.id ?? ''), // Convert id to string (API returns number)
      firstName: resource.firstName,
      lastName: resource.lastName,
      phoneNumber: resource.phone,
      email: resource.email,
      ruc: resource.ruc,
      isDeleted: resource.isDeleted ?? false
    } as any);
  }

  // En provider.assembler.ts

  toEntitiesFromResponse(response: any): Provider[] {
    // 1. Si la respuesta es un array directo
    if (Array.isArray(response)) {
      // Tipamos 'resource' como ProviderResource
      return response.map((resource: ProviderResource) => this.toEntityFromResource(resource));
    }

    // 2. Si la respuesta viene envuelta en el objeto { providers: [...] }
    if (response && response.providers && Array.isArray(response.providers)) {
      // Tipamos 'resource' aquí también
      return response.providers.map((resource: ProviderResource) => this.toEntityFromResource(resource));
    }

    // 3. Fallback
    console.warn('ProviderAssembler: Formato de respuesta no reconocido o vacío', response);
    return [];
  }

  toResourceFromEntity(entity: Provider): ProviderResource {
    return {
      id: entity.id ?? '',
      firstName: entity.firstName,
      lastName: entity.lastName,
      phoneNumber: entity.phoneNumber,
      email: entity.email,
      ruc: entity.ruc,
      isDeleted: entity.isDeleted
    } as ProviderResource;
  }
}
