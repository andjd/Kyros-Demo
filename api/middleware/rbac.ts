import { Context } from "hono";

export enum ROLE {
  Admin = "Admin",
  Clinician = "Clinician"
}

// RBAC decorator function
export function Allowed(allowedRoles: ROLE[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (c: Context) {
      const payload = c.get("jwtPayload");
      
      if (!payload) {
        c.status(401)
        return c.render({ error: "Unauthorized" });
      }
      
      // Get user roles - can be a string or array
      let userRoles: string[] = [];
      if (typeof payload.role === 'string') {
        userRoles = payload.role.split(',').map(r => r.trim());
      } else if (Array.isArray(payload.role)) {
        userRoles = payload.role;
      }
      
      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some(role => 
        userRoles.includes(role.toString())
      );
      
      if (!hasPermission) {
        c.status(403)
        return c.render({ 
          error: "Insufficient permissions", 
          required: allowedRoles,
          userRoles: userRoles 
        });
      }
      
      return originalMethod.call(this, c);
    };
    
    return descriptor;
  };
}

// Middleware to check roles
export function requireRoles(allowedRoles: ROLE[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const payload = c.get("jwtPayload");
    
    if (!payload) {
      c.status(401)
      return c.render({ error: "Unauthorized" });
    }
    
    // Get user roles - can be a string or array
    let userRoles: string[] = [];
    if (typeof payload.role === 'string') {
      userRoles = payload.role.split(',').map(r => r.trim());
    } else if (Array.isArray(payload.role)) {
      userRoles = payload.role;
    }
    
    // Check if user has any of the allowed roles
    const hasPermission = allowedRoles.some(role => 
      userRoles.includes(role.toString())
    );
    
    if (!hasPermission) {
      c.status(403)
      return c.render({ 
        error: "Insufficient permissions", 
        required: allowedRoles,
        userRoles: userRoles 
      });
    }
    
    await next();
  };
}