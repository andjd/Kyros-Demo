import type { User } from "../server.ts"
import { FileAdapter } from "./FileAdapter.ts";

export interface AuditEntry {
  userId: number;
  userRole: string;
  action: string;
  timestamp: string;
  payload: Record<string, any>;
}

export interface AuditAdapter {
  log(entry: AuditEntry): Promise<void>;
}

class AuditLog {
  private adapter: AuditAdapter;

  constructor(adapter: AuditAdapter) {
    this.adapter = adapter;
  }

  log(
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

    setTimeout(() => {
      this.adapter.log(entry).catch(console.error);
    }, 0);
  }
}

export const auditLog = new AuditLog(new FileAdapter)