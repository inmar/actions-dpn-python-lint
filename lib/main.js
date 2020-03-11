"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
/// Run a command inside the virtual env
function venvExec(venvDir, executable, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const actualExecutable = path.join(venvDir, 'bin', executable);
        yield exec.exec(actualExecutable, args);
    });
}
/// Create the virtualenv
function createVenv(venvDir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec('python', ['-m', 'venv', venvDir]);
    });
}
/// Build the path to the virtualenv
function buildVenvDir() {
    // Create the venv path
    const homeDir = process.env['HOME'];
    const actionId = process.env['GITHUB_ACTION'];
    if (!homeDir) {
        throw new Error('HOME MISSING');
    }
    return path.join(homeDir, `venv-${actionId}`);
}
/// Get the action input as JSON
function getInputJSON(name) {
    return JSON.parse(core.getInput(name));
}
/// Set everything up
function initialize(runBlack, runFlake8) {
    return __awaiter(this, void 0, void 0, function* () {
        // The path to the virtualenv
        const venvDir = buildVenvDir();
        // Create the virtualenv
        yield createVenv(venvDir);
        // What needs to be installed
        const args = ['install'];
        if (runBlack) {
            args.push('black');
        }
        if (runFlake8) {
            args.push('flake8');
        }
        // Install flake8 & black
        yield venvExec(venvDir, 'pip', args);
        return venvDir;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // The list of directories to check with linters
            const directories = core.getInput('directories').split(',');
            // Should black be run?
            const runBlack = getInputJSON('black');
            // Should flake8 be run?
            const runFlake8 = getInputJSON('flake8');
            // If there's nothing to run, do nothing
            if (!runBlack && !runFlake8) {
                return;
            }
            // Set everything up
            const venvDir = yield initialize(runBlack, runFlake8);
            if (runFlake8) {
                const args = directories;
                // Run flake8.  Should fail if it finds any issues
                yield venvExec(venvDir, 'flake8', args);
            }
            if (runBlack) {
                const args = ['--check'].concat(directories);
                // Run black.  Should fail if it finds any issues
                yield venvExec(venvDir, 'black', args);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
