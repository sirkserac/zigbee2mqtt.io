import Database from '@tauri-apps/plugin-sql';
import type { Project, ProjectStatus } from '@/types/project';
import { CURRENT_SCHEMA_VERSION } from '@/types/project';

/**
 * Lightning bewaart projecten in een lokale SQLite-databank (lightning.db).
 * Elk project wordt bewaard als één rij: kolommen voor snelle dashboard-zoek-
 * en filterfunctionaliteit (naam, klant, adres, EAN, datum), plus een JSON-
 * kolom `data` met de volledige projectstructuur (borden/kringen/schema's).
 * Dit houdt de relationele laag eenvoudig terwijl het datamodel (project.ts)
 * vrij kan evolueren zonder telkens migraties op tientallen tabellen nodig
 * te hebben.
 */

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load('sqlite:lightning.db').then(async (db) => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          client_name TEXT NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          ean_code TEXT,
          status TEXT NOT NULL DEFAULT 'concept',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          schema_version INTEGER NOT NULL DEFAULT ${CURRENT_SCHEMA_VERSION},
          data TEXT NOT NULL
        );
      `);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_name);`);
      return db;
    });
  }
  return dbPromise;
}

export interface ProjectListItem {
  id: string;
  name: string;
  clientName: string;
  address: string;
  eanCode?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface ProjectSearchFilters {
  query?: string;
  status?: ProjectStatus;
  fromDate?: string;
  toDate?: string;
}

export async function listProjects(filters: ProjectSearchFilters = {}): Promise<ProjectListItem[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.query) {
    clauses.push('(name LIKE ? OR client_name LIKE ? OR address LIKE ? OR ean_code LIKE ?)');
    const like = `%${filters.query}%`;
    params.push(like, like, like, like);
  }
  if (filters.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }
  if (filters.fromDate) {
    clauses.push('updated_at >= ?');
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    clauses.push('updated_at <= ?');
    params.push(filters.toDate);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.select<
    Array<{
      id: string;
      name: string;
      client_name: string;
      address: string;
      ean_code: string | null;
      status: ProjectStatus;
      created_at: string;
      updated_at: string;
      data: string;
    }>
  >(`SELECT id, name, client_name, address, ean_code, status, created_at, updated_at, data FROM projects ${where} ORDER BY updated_at DESC`, params);

  return rows.map((row) => {
    const parsed = JSON.parse(row.data) as Project;
    return {
      id: row.id,
      name: row.name,
      clientName: row.client_name,
      address: row.address,
      eanCode: row.ean_code ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      thumbnail: parsed.thumbnail,
    };
  });
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const rows = await db.select<Array<{ data: string }>>('SELECT data FROM projects WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return JSON.parse(rows[0].data) as Project;
}

export async function countProjects(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<Array<{ count: number }>>('SELECT COUNT(*) as count FROM projects');
  return rows[0]?.count ?? 0;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO projects (id, name, client_name, address, ean_code, status, created_at, updated_at, schema_version, data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       client_name = excluded.client_name,
       address = excluded.address,
       ean_code = excluded.ean_code,
       status = excluded.status,
       updated_at = excluded.updated_at,
       schema_version = excluded.schema_version,
       data = excluded.data`,
    [
      project.id,
      project.name,
      project.clientName,
      project.address,
      project.eanCode ?? null,
      project.status,
      project.createdAt,
      project.updatedAt,
      project.schemaVersion,
      JSON.stringify(project),
    ],
  );
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM projects WHERE id = ?', [id]);
}
