import { Context, Next } from "hono";
import { instanceToPlain } from "class-transformer";
import { ROLE } from "../rbac.ts";

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
  
  return transformed;
}

export const transformResponse = async (c: Context, next: Next) => {
  await next();
  
  // Only transform JSON responses
  const contentType = c.res.headers.get('Content-Type');
  if (!contentType?.includes('application/json')) {
    return;
  }
  
  try {
    // Get user roles from JWT payload
    const payload = c.get("jwtPayload");
    const userRoles = getUserRoles(payload);
    
    // Get the response body
    const response = await c.res.json();
    
    // Transform the response recursively
    const transformedResponse = transformValue(response, userRoles);
    
    // Set the transformed response
    c.res = new Response(JSON.stringify(transformedResponse), {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: c.res.headers
    });
    
  } catch (error) {
    // If transformation fails, leave response as is
    console.warn("Failed to transform response:", error);
  }
};