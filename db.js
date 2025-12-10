import { Pool } from 'pg';

const pool = new Pool({
  user: 'jasonagung',
  host: 'localhost',
  database: 'backend_tubes',
  password: 'dazbee',
  port: 5432,
});


export default pool;