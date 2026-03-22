import initSqlJs from 'sql.js'

let db = null
let SQL = null

function getWasmPath() {
  if (typeof window !== 'undefined' && window.electronAPI?.wasmPath) {
    return window.electronAPI.wasmPath
  }

  const wasmPathArg = process.argv?.find(arg => arg.startsWith('wasm-path='))
  if (wasmPathArg) {
    return wasmPathArg.replace('wasm-path=', '')
  }

  return '/node_modules/sql.js/dist/sql-wasm.wasm'
}

export async function initDB() {
  if (db) {
    return db
  }

  try {
    const wasmPath = getWasmPath()

    SQL = await initSqlJs({
      locateFile: (file) => {
        if (file.endsWith('.wasm')) {
          return wasmPath
        }
        return file
      },
    })

    db = new SQL.Database()

    return db
  } catch (error) {
    console.error('Failed to initialize SQLite:', error)
    throw error
  }
}

export function createTestTable() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS test_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `

  db.run(sql)
  return true
}

export function insertTest(name, value) {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }

  const sql = 'INSERT INTO test_table (name, value) VALUES (?, ?)'
  db.run(sql, [name, value])
  return true
}

export function queryTest() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }

  const sql = 'SELECT * FROM test_table ORDER BY created_at DESC'
  const result = db.exec(sql)

  if (result.length === 0) {
    return []
  }

  const columns = result[0].columns
  const values = result[0].values

  return values.map((row) => {
    const obj = {}
    columns.forEach((col, index) => {
      obj[col] = row[index]
    })
    return obj
  })
}

export function exportDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.')
  }

  const data = db.export()
  return data
}

export function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

export function getDB() {
  return db
}

export function getSQL() {
  return SQL
}
