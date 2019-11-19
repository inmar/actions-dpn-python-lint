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
function venvExec(venv_dir, executable, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const actual_executable = path.join(venv_dir, "bin", executable);
        return yield exec.exec(actual_executable, args);
    });
}
/// Create the virtualenv
function createVenv(venv_dir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("python", ["-m", "venv", venv_dir]);
    });
}
/// Build the path to the virtualenv
function buildVenvDir() {
    // Create the venv path
    const home_dir = process.env["HOME"];
    const action_id = process.env["GITHUB_ACTION"];
    if (!home_dir) {
        throw new Error("HOME MISSING");
    }
    return path.join(home_dir, `venv-${action_id}`);
}
/// Get the action input as JSON
function getInputJSON(name) {
    return JSON.parse(core.getInput(name));
}
/// Set everything up
function initialize(run_black, run_flake8) {
    return __awaiter(this, void 0, void 0, function* () {
        // The path to the virtualenv
        const venv_dir = buildVenvDir();
        // Create the virtualenv
        yield createVenv(venv_dir);
        // What needs to be installed
        var args = ["install"];
        if (run_black) {
            args.push("black");
        }
        if (run_flake8) {
            args.push("flake8");
        }
        // Install flake8 & black
        yield venvExec(venv_dir, "pip", args);
        return venv_dir;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // The list of directories to check with linters
            const directories = core.getInput("directories").split(",");
            // Should black be run?
            const run_black = getInputJSON("black");
            // Should flake8 be run?
            const run_flake8 = getInputJSON("flake8");
            // If there's nothing to run, do nothing
            if (!run_black && !run_flake8) {
                return;
            }
            // Set everything up
            const venv_dir = yield initialize(run_black, run_flake8);
            if (run_flake8) {
                // Run flake8.  Should fail if it finds any issues
                yield venvExec(venv_dir, "flake8", [directories.join(" ")]);
            }
            if (run_black) {
                // Run black.  Should fail if it finds any issues
                yield venvExec(venv_dir, "black", ["--check", directories.join(" ")]);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
