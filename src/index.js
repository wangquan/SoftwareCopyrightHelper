const fs = require("fs");
const readline = require("readline");
const path = require("path");
const { ipcRenderer } = require("electron");

const VERSION = "1.0.0";

document.title = document.title + "(wq ver" + VERSION + ")";

let extensions = [];//扩展名集合
let isExcludeBlankLine = false;//是否排除空行
let isMergeCode = true;//是否合并代码
let rootDir = "";//根目录
let totalLines = 0;//总行数

let inpExtensions = document.getElementById("inp_extensions");
let togExcludeBlankLine = document.getElementById("tog_excludeblankline");
let togMergeCode = document.getElementById("tog_mergecode");
let btnSelectRootDir = document.getElementById("btn_selectrootdir");
let btnExecute = document.getElementById("btn_execute");
let labInfos = document.getElementById("lab_infos");

// PRIVATE FUNCTIONS:

/**
 * 是否包含扩展名
 * @param {string} ext 
 * @param {string[]} extensions 
 */
function isIncludeExtension(ext, extensions) {
    for (let i = 0; i < extensions.length; i++) {
        if (ext === extensions[i]) {
            return true;
        }
    }
    return false;
}

/**
 * 记录所有文件路径（符合扩展名要求的文件）
 * @param {string} currentDirPath 
 * @param {string[]} filePaths 
 */
function recordAllFilePaths(currentDirPath, filePaths) {
    let rd = fs.readdirSync(currentDirPath);
    for (let i = 0; i < rd.length; i++) {
        let filePath = path.join(currentDirPath, rd[i]);
        let fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
            recordAllFilePaths(filePath, filePaths);
        }else if (fileStats.isFile() && isIncludeExtension(path.extname(filePath), extensions)) {
            filePaths.push(filePath);
        }
    }
}

/**
 * 读取所有文件行数
 * @param {number} index 
 * @param {string[]} filePaths 
 * @param {fs.WriteStream} ws
 * @param {string} exportMergeCodeFilePath
 */
function readAllFileLines(index, filePaths, ws, exportMergeCodeFilePath) {
    let rl = readline.createInterface({
        input: fs.createReadStream(filePaths[index])
    });
    rl.on("line", function(line) {
        if (!(isExcludeBlankLine && line.trim() === "")) {
            totalLines++;
            if (ws) {
                ws.write(line + "\n");
            }
        }
    });
    rl.on("close", function() {
        index++;
        if (index < filePaths.length) {
            readAllFileLines(index, filePaths, ws, exportMergeCodeFilePath);
        }else {
            completeTasks(filePaths, exportMergeCodeFilePath);
        }
    });
}

/**
 * 完成任务
 * @param {string[]} filePaths
 * @param {string} exportMergeCodeFilePath
 */
function completeTasks(filePaths, exportMergeCodeFilePath) {
    let str = "=====================================================\n";
    str += "代码统计结果" + (new Date()).toString() + ":\n";
    str += "是否排除空白行：" + isExcludeBlankLine + "\n";
    str += "遍历代码文件数：" + filePaths.length + "\n";
    str += "统计代码行数：" + totalLines + "\n";
    if (exportMergeCodeFilePath) {
        str += "生成合并代码文件地址：" + exportMergeCodeFilePath + "\n";
    }
    str += "=====================================================\n";
    for (let i = 0; i < filePaths.length; i++) {
        str += filePaths[i] + "\n";
    }
    labInfos.innerText = str;
}

/**
 * 执行任务
 * @param {string} exportMergeCodeFilePath
 */
function performTasks(exportMergeCodeFilePath) {
    totalLines = 0;
    let filePaths = [];

    recordAllFilePaths(rootDir, filePaths);
    if (filePaths.length > 0) {
        if (exportMergeCodeFilePath) {
            readAllFileLines(0, filePaths, fs.createWriteStream(exportMergeCodeFilePath), exportMergeCodeFilePath);
        }else {
            readAllFileLines(0, filePaths);
        }
    }else {
        completeTasks(filePaths);
    }
}

// EVENT HANDLERS:

function recSelectRootDir(event, dirPath) {
    rootDir = dirPath;
    btnSelectRootDir.value = rootDir;
}

function recExportPath(event, filePath) {
    console.log("export path:%s", filePath);
    performTasks(filePath);
}

function onSelectRootDirButtonClickHandler() {
    ipcRenderer.send("open-dialog-selectrootdir");
}

function onExecuteButtonClickHandler() {
    //校对参数
    if (inpExtensions.value === undefined || inpExtensions.value === "") {
        window.alert("无效的扩展名！");
        return;
    }
    extensions = inpExtensions.value.split(",");
    isExcludeBlankLine = togExcludeBlankLine.checked;
    isMergeCode = togMergeCode.checked;
    if (rootDir === undefined || rootDir === "") {
        window.alert("请选择项目代码根目录！");
        return;
    }

    console.log(extensions);
    console.log("isExcludeBlankLine:%s, isMergeCode:%s", isExcludeBlankLine, isMergeCode);

    if (isMergeCode) {
        ipcRenderer.send("save-dialog-exportpath");
    }else {
        performTasks();
    }
}

ipcRenderer.on("rec-selectrootdir", recSelectRootDir);
ipcRenderer.on("rec-exportpath", recExportPath);

btnSelectRootDir.addEventListener("click", onSelectRootDirButtonClickHandler);
btnExecute.addEventListener("click", onExecuteButtonClickHandler);