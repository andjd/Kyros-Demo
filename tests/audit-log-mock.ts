import { User } from "../api/app.ts";
import { AuditEntry } from "../api/audit/AuditLog.ts";


let logs: AuditEntry[] = [];

export function log(
    {id: userId, role: userRole}: User,
    action: string,
    payload: Record<string, any> = {}
  ): void {
    const entry: AuditEntry = {
      userId,
      userRole,
      action,
      timestamp: new Date().toISOString(),
      payload,
    };
    logs.push(entry);
  }

  export function getLogs(): AuditEntry[] {
    return [...logs];
  }

  export function clear(): void {
    logs = [];
  }
