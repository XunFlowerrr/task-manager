import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseURL });

interface QueryResult {
  rows: any[];
  rowCount: number;
}

export const query = async (text: string, params?: any[]): Promise<pg.QueryResult> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}
