import { Context } from "hono";
import { instanceToPlain } from "class-transformer";
import { ROLE } from "./rbac.ts";

// Helper to get user roles from JWT payload
function getUserRoles(payload: any): ROLE[] {
  if (!payload?.role) return [];
  
  if (typeof payload.role === 'string') {
    return payload.role.split(',')
      .map((role: string) => role.trim())
      .filter((role: string) => Object.values(ROLE).includes(role as ROLE)) as ROLE[];
  }
  
  return [];
}

// Helper to recursively transform class instances to plain objects
function transformValue(value: any, userRoles: ROLE[]): any {
  console.log(value)
  // If it's null or undefined, return as is
  if (value == null) return value;
  
  // If it's a primitive, return as is
  if (typeof value !== 'object') return value;
  
  // If it's an array, transform each element
  if (Array.isArray(value)) {
    return value.map(item => transformValue(item, userRoles));
  }
  
  // If it's a class instance with transformation decorators
  if (value.constructor && value.constructor !== Object) {
    try {
      return instanceToPlain(value, {
        groups: userRoles,
        enableImplicitConversion: true,
        excludeExtraneousValues: false
      });
    } catch (error) {
      // If transformation fails, fall back to plain object handling
      console.warn("Failed to transform class instance:", error);
    }
  }
  
  // If it's a plain object, recursively transform its properties
  const transformed: any = {};
  for (const [key, val] of Object.entries(value)) {
    transformed[key] = transformValue(val, userRoles);
  }
  console.log(transformed)
  return transformed;
}

export const transformResponse = async (c: Context, content: any) => {
  try {
    // Get user roles from JWT payload
    const payload = c.get("jwtPayload");
    const userRoles = getUserRoles(payload);

    
    return c.json(transformValue(content, userRoles));
    
  } catch (error) {
    // If transformation fails, leave response as is
    console.warn("Failed to transform response:", error);
    c.json(content)
  }
};