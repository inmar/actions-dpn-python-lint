import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as path from 'path';


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


class Linter {
  public readonly runBlack: boolean;
  public readonly runFlake8: boolean;
  private readonly directories: string[];
  private venv: string;

  constructor(black: boolean, flake8: boolean, directories: string[]) {
    this.runBlack = black;
    this.runFlake8 = flake8;
    this.directories = directories;
    this.venv = '';
  }

  /// Run a command inside the virtual env
  private async venvExec(executable, args) {
    const actual_executable = path.join(this.venv, "bin", executable);
    return await exec.exec(actual_executable, args);
  }


  public async initialize(): Promise<void> {
    // The path to the virtualenv
    this.venv = buildVenvDir();

    // Create the virtualenv
    await createVenv(this.venv)

    // What needs to be installed
    var args: string[] = ["install"];

    if (this.runBlack) {
      args.push("black");
    }

    if (this.runFlake8) {
      args.push("flake8");
    }

    // Install flake8 & black
    await this.venvExec("pip", args);
  }

  public async run(): Promise<void> {
    // Set everything up
    if (this.runFlake8) {
      let args: string[] = this.directories;

      // Run flake8.  Should fail if it finds any issues
      await this.venvExec("flake8", args)
    }

    if (this.runBlack) {
      let args = ["--check"].concat(this.directories)

      // Run black.  Should fail if it finds any issues
      await this.venvExec("black", args)
    }
  }
}


async function run() {
  try {
    let black: boolean = getInputJSON("black");
    let flake8: boolean = getInputJSON("flake8");

    if (!black && !flake8) {
      core.info("Neither black nor flake8 were enabled");
      return;
    }

    let linter: Linter = new Linter(black, flake8, core.getInput("directories").split(","));

    await linter.initialize();
    await linter.run();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
