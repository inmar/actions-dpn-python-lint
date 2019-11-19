import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';


/// Run a command inside the virtual env
async function venvExec(venv_dir, executable, args) {
  const actual_executable = path.join(venv_dir, "bin", executable);
  return await exec.exec(actual_executable, args);
}


/// Create the virtualenv
async function createVenv(venv_dir) {
  await exec.exec("python", ["-m", "venv", venv_dir])
}


/// Build the path to the virtualenv
function buildVenvDir(): string {
  // Create the venv path
  const home_dir = process.env["HOME"];
  const action_id = process.env["GITHUB_ACTION"];

  if (!home_dir) {
    throw new Error("HOME MISSING");
  }

  return path.join(home_dir, `venv-${action_id}`);
}


/// Get the action input as JSON
function getInputJSON(name: string) {
  return JSON.parse(core.getInput(name));
}


/// Set everything up
async function initialize(run_black, run_flake8) {
  // The path to the virtualenv
  const venv_dir = buildVenvDir();

  // Create the virtualenv
  await createVenv(venv_dir)

  // What needs to be installed
  var args: string[] = ["install"];

  if (run_black) {
    args.push("black");
  }

  if (run_flake8) {
    args.push("flake8");
  }

  // Install flake8 & black
  await venvExec(venv_dir, "pip", args);

  return venv_dir;
}


async function run() {
  try {
    // The list of directories to check with linters
    const directories: string[] = core.getInput("directories").split(",");
    // Should black be run?
    const run_black = getInputJSON("black");
    // Should flake8 be run?
    const run_flake8 = getInputJSON("flake8");

    // If there's nothing to run, do nothing
    if (!run_black && !run_flake8) {
      return;
    }

    // Set everything up
    const venv_dir = await initialize(run_black, run_flake8);

    if (run_flake8) {
      // Run flake8.  Should fail if it finds any issues
      await venvExec(venv_dir, "flake8", [directories.join(" ")])
    }

    if (run_black) {
      // Run black.  Should fail if it finds any issues
      await venvExec(venv_dir, "black", ["--check", directories.join(" ")])
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
