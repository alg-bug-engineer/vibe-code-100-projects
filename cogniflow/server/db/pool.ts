/**
 * PostgreSQL 数据库连接配置
 */
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'cogniflow',
  user: process.env.POSTGRES_USER || 'cogniflow_user',
  password: process.env.POSTGRES_PASSWORD || 'cogniflow_password_2024',
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('✅ PostgreSQL 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 数据库错误:', err);
});

// 导出查询方法
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 执行查询:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 查询失败:', { text, error });
    throw error;
  }
};

// 导出事务方法
export const transaction = async (callback: (client: pg.PoolClient) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 导出连接池
export default pool;
