import { spawn } from 'child_process'
import http from 'http'

console.log('Starting Vite development server...')

const viteProcess = spawn('npx', ['vite'], {
  stdio: 'pipe',
  shell: true,
})

viteProcess.stdout.on('data', (data) => {
  const output = data.toString()
  process.stdout.write(output)

  if (output.includes('ready in') || output.includes('Local:')) {
    console.log('\nVite is ready, starting Electron in 2 seconds...')
    setTimeout(startElectron, 2000)
  }
})

viteProcess.stderr.on('data', (data) => {
  process.stderr.write(data)
})

let electronStarted = false

function startElectron() {
  if (electronStarted) return
  electronStarted = true

  console.log('Starting Electron...')

  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  })

  electronProcess.on('close', (code) => {
    console.log(`Electron exited with code ${code}`)
    viteProcess.kill()
    process.exit(code)
  })

  electronProcess.on('error', (err) => {
    console.error('Failed to start Electron:', err)
    viteProcess.kill()
    process.exit(1)
  })
}

viteProcess.on('close', (code) => {
  console.log(`Vite exited with code ${code}`)
  process.exit(code)
})

process.on('SIGINT', () => {
  viteProcess.kill()
  process.exit(0)
})
