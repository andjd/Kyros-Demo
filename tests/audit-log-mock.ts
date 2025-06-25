// Mock audit log for testing
export interface AuditLogEntry {
  timestamp: string;
  user: any;
  action: string;
  details?: any;
}

class MockAuditLog {
  private logs: AuditLogEntry[] = [];

  log(user: any, action: string, details?: any): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      user,
      action,
      details
    });
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByUser(userId: number): AuditLogEntry[] {
    return this.logs.filter(log => log.user?.id === userId);
  }

  getLogsByAction(action: string): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  clear(): void {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

export const mockAuditLog = new MockAuditLog();