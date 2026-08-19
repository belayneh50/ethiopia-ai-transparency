export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => {
  return (target: any, key?: any, descriptor?: any) => {
    const metadataKey = ROLES_KEY;
    if (descriptor) {
      const existingRoles = Reflect.getMetadata(metadataKey, descriptor.value) || [];
      Reflect.defineMetadata(metadataKey, [...existingRoles, ...roles], descriptor.value);
      return descriptor;
    }
    return roles;
  };
};