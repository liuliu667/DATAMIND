import * as XLSX from 'xlsx/xlsx.mjs'
import fs from 'fs'
import path from 'path'

const testDir = path.join(process.cwd(), 'test-files')

if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true })
}

function writeXlsxFile(wb, filePath) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  fs.writeFileSync(filePath, buf)
}

function createSmallFile() {
  const data = []

  data.push(['ID', 'Name', 'Email', 'JoinDate', 'Amount', 'Status'])

  for (let i = 1; i <= 100; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')

    data.push([
      i,
      `User ${i}`,
      `user${i}@example.com`,
      dateStr,
      (Math.random() * 10000).toFixed(2),
      i % 3 === 0 ? 'Active' : 'Inactive',
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const filePath = path.join(testDir, 'test_small.xlsx')
  writeXlsxFile(wb, filePath)
  console.log(`Created: ${filePath} (${data.length - 1} rows)`)
}

function createLargeFile() {
  const data = []

  data.push(['ID', 'Name', 'Email', 'RegisterDate', 'OrderAmount', 'Category', 'Region'])

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports']
  const regions = ['North', 'South', 'East', 'West', 'Central']

  for (let i = 1; i <= 60000; i++) {
    const date = new Date(2023, 0, 1)
    date.setDate(date.getDate() + (i % 365))
    const dateStr = date.toISOString().split('T')[0]

    data.push([
      i,
      `Customer_${i}`,
      `customer${i}@test.com`,
      dateStr,
      (Math.random() * 5000 + 100).toFixed(2),
      categories[i % categories.length],
      regions[i % regions.length],
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const filePath = path.join(testDir, 'test_large.xlsx')
  writeXlsxFile(wb, filePath)
  console.log(`Created: ${filePath} (${data.length - 1} rows)`)
}

function createHugeFile() {
  const data = []

  data.push(['ID', 'Name', 'Email', 'Date', 'Value'])

  for (let i = 1; i <= 160000; i++) {
    data.push([i, `Item_${i}`, `email${i}@test.com`, '2024-01-01', i * 10])
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const filePath = path.join(testDir, 'test_huge.xlsx')
  writeXlsxFile(wb, filePath)
  console.log(`Created: ${filePath} (${data.length - 1} rows)`)
}

function createDateTestFile() {
  const data = []

  data.push([
    'ID',
    'StandardDate',
    'SlashDate',
    'DotDate',
    'ChineseDate',
    'MixedDate',
    'InvalidDate',
    'Name',
  ])

  const dates = [
    ['2024-01-15', '2024/01/15', '2024.01.15', '2024年01月15日', 'Jan 15 2024', 'invalid'],
    ['2024-02-20', '2024/02/20', '2024.02.20', '2024年02月20日', '20 Feb 2024', 'not-a-date'],
    ['2024-03-10', '2024/03/10', '2024.03.10', '2024年03月10日', '2024-03-10', ''],
    ['2024-04-05', '2024/04/05', '2024.04.05', '2024年04月05日', '04/05/2024', 'bad'],
    ['2024-05-25', '2024/05/25', '2024.05.25', '2024年05月25日', '25 May 2024', 'error'],
  ]

  for (let i = 0; i < dates.length; i++) {
    data.push([i + 1, ...dates[i], `Test${i + 1}`])
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  const filePath = path.join(testDir, 'test_dates.xlsx')
  writeXlsxFile(wb, filePath)
  console.log(`Created: ${filePath} (${data.length - 1} rows with various date formats)`)
}

console.log('Creating test Excel files...\n')

createSmallFile()
createDateTestFile()

console.log('\nCreating large file (60,000 rows)...')
createLargeFile()

console.log('\nCreating huge file (160,000 rows)...')
createHugeFile()

console.log('\nAll test files created in:', testDir)
