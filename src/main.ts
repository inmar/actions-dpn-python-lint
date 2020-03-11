import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'

/// Run a command inside the virtual env
async function venvExec(
  venvDir: string,
  executable: string,
  args: string[]
): Promise<void> {
  const actualExecutable = path.join(venvDir, 'bin', executable)
  await exec.exec(actualExecutable, args)
}

/// Create the virtualenv
async function createVenv(venvDir: string): Promise<void> {
  await exec.exec('python', ['-m', 'venv', venvDir])
}

/// Build the path to the virtualenv
function buildVenvDir(): string {
  // Create the venv path
  const homeDir = process.env['HOME']
  const actionId = process.env['GITHUB_ACTION']

  if (!homeDir) {
    throw new Error('HOME MISSING')
  }

  return path.join(homeDir, `venv-${actionId}`)
}

/// Get the action input as JSON
function getInputJSON(name: string): boolean {
  return JSON.parse(core.getInput(name))
}

/// Set everything up
async function initialize(
  runBlack: boolean,
  runFlake8: boolean
): Promise<string> {
  // The path to the virtualenv
  const venvDir = buildVenvDir()

  // Create the virtualenv
  await createVenv(venvDir)

  // What needs to be installed
  const args: string[] = ['install']

  if (runBlack) {
    args.push('black')
  }

  if (runFlake8) {
    args.push('flake8')
  }

  // Install flake8 & black
  await venvExec(venvDir, 'pip', args)

  return venvDir
}

async function run(): Promise<void> {
  try {
    // The list of directories to check with linters
    const directories: string[] = core.getInput('directories').split(',')
    // Should black be run?
    const runBlack = getInputJSON('black')
    // Should flake8 be run?
    const runFlake8 = getInputJSON('flake8')

    // If there's nothing to run, do nothing
    if (!runBlack && !runFlake8) {
      return
    }

    // Set everything up
    const venvDir = await initialize(runBlack, runFlake8)

    if (runFlake8) {
      const args: string[] = directories

      // Run flake8.  Should fail if it finds any issues
      await venvExec(venvDir, 'flake8', args)
    }

    if (runBlack) {
      const args = ['--check'].concat(directories)

      // Run black.  Should fail if it finds any issues
      await venvExec(venvDir, 'black', args)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
