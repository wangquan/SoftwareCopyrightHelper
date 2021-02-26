const { app, BrowserWindow, dialog, Menu, ipcMain } = require("electron");

function createWindow() {
    Menu.setApplicationMenu(null);
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

//打开选择代码根目录对话框
ipcMain.on("open-dialog-selectrootdir", function(event) {
    dialog.showOpenDialog({
        title: "选择项目代码根目录",
        properties: ["openDirectory"]
    }).then(function(result) {
        if (!result.canceled && result.filePaths) {
            event.sender.send("rec-selectrootdir", result.filePaths[0]);
        }
    });
});

//保存导出合并代码文件对话框
ipcMain.on("save-dialog-exportpath", function(event) {
    dialog.showSaveDialog({
        title: "保存合并代码文件（注意：会替换同名文件！）",
        defaultPath: "./codes.txt"
    }).then(function(result) {
        if (!result.canceled && result.filePath) {
            event.sender.send("rec-exportpath", result.filePath);
        }
    });
});