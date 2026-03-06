import * as vscode from 'vscode';
import initSqlJs, { Database } from 'sql.js';
import { randomUUID } from 'crypto';

type InteractionStatus = 'completed' | 'cancelled' | 'error';
export type Decision =
  | 'accepted'
  | 'rejected'
  | 'copied'
  | 'edited'
  | 'cancelled'
  | 'moe_reviewed'
  | 'moe_risk_low'
  | 'moe_risk_medium'
  | 'moe_risk_high';

function execToObjects(db: Database, sql: string): Array<Record<string, unknown>> {
  const result = db.exec(sql);
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i] ?? String(i)] = row[i];
    }
    return obj;
  });
}

export class MemoryStore {
  private dbPromise: Promise<Database> | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly options: { enabled: boolean } = { enabled: true }
  ) {}

  async logInteractionStart(input: {
    provider: string;
    model: string;
    command: string;
    contextHash: string;
    promptChars: number;
    rawContext?: string;
  }): Promise<string> {
    if (!this.options.enabled) return '';
    const id = randomUUID();
    const db = await this.getDb();

    db.run(
      `INSERT INTO interactions (id, timestamp, provider, model, command, context_hash, prompt_chars, status, raw_context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        Date.now(),
        input.provider,
        input.model,
        input.command,
        input.contextHash,
        input.promptChars,
        'running',
        input.rawContext ?? null
      ]
    );

    await this.persist(db);
    return id;
  }

  async logInteractionEnd(interactionId: string, input: { status: InteractionStatus; responseChars?: number }) {
    if (!this.options.enabled) return;
    if (!interactionId) return;
    const db = await this.getDb();

    db.run(
      `UPDATE interactions SET status = ?, response_chars = ?, ended_timestamp = ? WHERE id = ?`,
      [input.status, input.responseChars ?? null, Date.now(), interactionId]
    );

    await this.persist(db);
  }

  async exportJson(): Promise<{ interactions: unknown[]; decisions: unknown[] }> {
    if (!this.options.enabled) return { interactions: [], decisions: [] };
    const db = await this.getDb();

    const interactions = execToObjects(db, `SELECT * FROM interactions ORDER BY timestamp DESC`);
    const decisions = execToObjects(db, `SELECT * FROM decisions ORDER BY timestamp DESC`);

    return { interactions, decisions };
  }

  async logDecision(interactionId: string, decision: Decision) {
    if (!this.options.enabled) return;
    if (!interactionId) return;
    const db = await this.getDb();

    db.run(
      `INSERT INTO decisions (id, interaction_id, timestamp, decision)
       VALUES (?, ?, ?, ?)`,
      [randomUUID(), interactionId, Date.now(), decision]
    );

    await this.persist(db);
  }

  private async getDb(): Promise<Database> {
    if (!this.options.enabled) {
      throw new Error('ANGO IA memory is disabled.');
    }
    if (!this.dbPromise) {
      this.dbPromise = this.openDb();
    }
    return this.dbPromise;
  }

  private async openDb(): Promise<Database> {
    if (!this.options.enabled) {
      throw new Error('ANGO IA memory is disabled.');
    }
    const SQL = await initSqlJs({});
    const dbFile = vscode.Uri.joinPath(this.context.globalStorageUri, 'ango-ia.sqlite');

    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

    let db: Database;
    try {
      const bytes = await vscode.workspace.fs.readFile(dbFile);
      db = new SQL.Database(bytes);
    } catch {
      db = new SQL.Database();
    }

    this.migrate(db);
    await this.persist(db);
    return db;
  }

  private migrate(db: Database) {
    db.run(
      `CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        ended_timestamp INTEGER,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        command TEXT NOT NULL,
        context_hash TEXT NOT NULL,
        prompt_chars INTEGER,
        response_chars INTEGER,
        status TEXT NOT NULL,
        raw_context TEXT
      );`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY,
        interaction_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        decision TEXT NOT NULL,
        FOREIGN KEY (interaction_id) REFERENCES interactions(id)
      );`
    );

    try {
      db.run(`ALTER TABLE interactions ADD COLUMN raw_context TEXT;`);
    } catch {
      // ignore if already exists
    }
  }

  private async persist(db: Database) {
    if (!this.options.enabled) return;
    const dbFile = vscode.Uri.joinPath(this.context.globalStorageUri, 'ango-ia.sqlite');
    const data = db.export();
    await vscode.workspace.fs.writeFile(dbFile, data);
  }
}
