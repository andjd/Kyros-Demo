import { AuditAdapter, AuditEntry } from "./AuditLog.ts";

export class FileAdapter implements AuditAdapter {
  private filePath: string;

  constructor(filePath: string = "audit_log.jsonl") {
    this.filePath = filePath;
  }

  async log(entry: AuditEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + "\n";
      await Deno.writeTextFile(this.filePath, logLine, { append: true });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}