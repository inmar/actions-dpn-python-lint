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
class Linter {
    constructor(black, flake8, directories) {
        this.runBlack = black;
        this.runFlake8 = flake8;
        this.directories = directories;
        this.venv = '';
    }
    /// Run a command inside the virtual env
    venvExec(executable, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const actual_executable = path.join(this.venv, "bin", executable);
            return yield exec.exec(actual_executable, args);
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // The path to the virtualenv
            this.venv = buildVenvDir();
            // Create the virtualenv
            yield createVenv(this.venv);
            // What needs to be installed
            var args = ["install"];
            if (this.runBlack) {
                args.push("black");
            }
            if (this.runFlake8) {
                args.push("flake8");
            }
            // Install flake8 & black
            yield this.venvExec("pip", args);
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // Set everything up
            if (this.runFlake8) {
                let args = this.directories;
                // Run flake8.  Should fail if it finds any issues
                yield this.venvExec("flake8", args);
            }
            if (this.runBlack) {
                let args = ["--check"].concat(this.directories);
                // Run black.  Should fail if it finds any issues
                yield this.venvExec("black", args);
            }
        });
    }
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let black = getInputJSON("black");
            let flake8 = getInputJSON("flake8");
            if (!black && !flake8) {
                core.info("Neither black nor flake8 were enabled");
                return;
            }
            let linter = new Linter(black, flake8, core.getInput("directories").split(","));
            yield linter.initialize();
            yield linter.run();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
