import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';


async function create_venv() {

}

async function run() {
  try {
    await exec.exec('pip', ['install', 'black', 'flake8']);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
