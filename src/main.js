const electron = require('electron');
const {app, BrowserWindow, ipcMain, LocalShortcut} = electron;
const electronLocalshortcut = require('electron-localshortcut');
const path = require('path');
const url = require('url');
const cp = require("child_process");
const fs = require('fs');
const readline = require('readline');
let win;
let con;

var conhide = true;
var conexis = false;
var conposx = 652;
var confirs = true;

function createConsol(){
    con = new BrowserWindow({
    parent: win,
    show: false,
    width: 800,
    height: 480,
    transparent: true,
    frame: false,
    toolbar: false
    });
    conexis = true;
    con.setMenu(null);
    con.setResizable(false);
    con.loadURL(url.format({
        pathname: path.join(__dirname, '/console.html'),
        protocol: 'file:',
        slashes: true
    }));
    con.on('closed', () => {
        conexis = false;
        conhide = true;
        confirs = true;
    });
    electronLocalshortcut.register(con, 'F12', () => {
        con.hide();
        conhide = true;
        win.focus();
    });
    electronLocalshortcut.register(con, 'H', () => {
        con.webContents.send('help');
    })
    electronLocalshortcut.register(con, 'CommandOrControl+Right', () => {
        con.setPosition(win.getPosition()[0] + conposx, win.getPosition()[1], false);
    })
    electronLocalshortcut.register(con, 'CommandOrControl+Left', () => {
        con.setPosition(win.getPosition()[0] - con.getSize()[0] - 10, win.getPosition()[1], false);
    })
    electronLocalshortcut.register(con, 'CommandOrControl+Down', () => {
        con.setPosition(win.getPosition()[0], win.getPosition()[1] + conposx, false);
    })
    electronLocalshortcut.register(con, 'CommandOrControl+Up', () => {
        con.setPosition(win.getPosition()[0], win.getPosition()[1] - con.getSize()[1] - 10, false);
    })
}
function createWindow(){
    win = new BrowserWindow({
        width: 642, 
        height: 642, 
        backgroundColor: '#FFE09F',
        frame: false,
        toolbar: false
    });
    win.setMenu(null);
    win.setResizable(false);
    win.setMaximizable(false);
    win.loadURL(url.format({
        pathname: path.join(__dirname, '/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.on('closed', () => { app.quit() });
    createConsol();
    electronLocalshortcut.register(win, 'F12', () => {
        if (conexis){
            if (conhide) {
                if (confirs) {
                    con.setPosition(win.getPosition()[0] + conposx, win.getPosition()[1], false);
                    confirs = false;
                }
                con.show();
                conhide = false;
            }
            else con.focus();
        }
        else {
            createConsol();
            if (confirs) {
                con.setPosition(win.getPosition()[0] + conposx, win.getPosition()[1], false);
                confirs = false;
            }
            con.show();
            conhide = false;
        }
    });
    electronLocalshortcut.register(win, 'Shift+Right', () => {
        win.webContents.send('addTime');
    })
    electronLocalshortcut.register(win, 'Shift+Left', () => {
        win.webContents.send('delTime');
    })
    electronLocalshortcut.register(win, 'P', () => {
        win.webContents.send('pass');
    })
    electronLocalshortcut.register(win, 'U', () => {
        win.webContents.send('undo');
    })
    electronLocalshortcut.register(win, 'R', () => {
        win.webContents.send('clear');
    })
    electronLocalshortcut.register(win, 'B', () => {
        win.webContents.send('aiblack');
    })
    electronLocalshortcut.register(win, 'W', () => {
        win.webContents.send('aiwhite');
    })
    electronLocalshortcut.register(win, 'N', () => {
        win.webContents.send('noai');
    })
    /*electronLocalshortcut.register(win, 'Shift+1', () => {
        win.webContents.send('level-1');
    })
    electronLocalshortcut.register(win, 'Shift+2', () => {
        win.webContents.send('level-2');
    })
    electronLocalshortcut.register(win, 'Shift+3', () => {
        win.webContents.send('level-3');
    })
    electronLocalshortcut.register(win, 'Shift+0', () => {
        win.webContents.send('level-0');
    })*/
    electronLocalshortcut.register(win, 'CommandOrControl+Right', () => {
        if (conexis) con.setPosition(win.getPosition()[0] + conposx, win.getPosition()[1], false);
    })
    electronLocalshortcut.register(win, 'CommandOrControl+Left', () => {
        if (conexis) con.setPosition(win.getPosition()[0] - con.getSize()[0] - 10, win.getPosition()[1], false);
    })
    electronLocalshortcut.register(win, 'CommandOrControl+Down', () => {
        if (conexis) con.setPosition(win.getPosition()[0], win.getPosition()[1] + conposx, false);
    })
    electronLocalshortcut.register(win, 'CommandOrControl+Up', () => {
        if (conexis) con.setPosition(win.getPosition()[0], win.getPosition()[1] - con.getSize()[1] - 10, false);
    })
}

const goBoard = exports.goBoard = require('./go_modules/board');
var Game = new goBoard;
var pathstr = path.join(__dirname, '..');
pathstr = path.join(pathstr, '..');
var lz = cp.spawn("leelaz.exe", ["-g", "-wnetwork", "--noponder", "-r0"], {cwd: pathstr})

lz.stderr.on('data', (data) => {
    console.log(data.toString());
    if (data.toString().slice(0, 18) == "BLAS Core: Haswell") lz.stdin.write("time_settings 0 2 1\n");
    con.webContents.send('constr', data.toString());
});

var doublecheck = false;
lz.stdout.on('data', (data) => {
    var str = data.toString();
    console.log(str);
    if (str[0] == "="){
        doublecheck = true;
        if (str.length > 3 && str.charAt(2)>='A' && str.charAt(2)<='T'){
            var gy = str.charCodeAt(2) - 64;
            if (gy > 8) gy--;
            var gx = str.charCodeAt(3) - 48;
            var t = str.charCodeAt(4) - 48;
            if (t >= 0 && t <=9) gx = gx * 10 + t;
            aiplay(20 - gx, gy);
            doublecheck = false;
        }
        else if (str.slice(2, 6) == "pass"){
            aipass();
            doublecheck = false;
        }
    }
    else if (doublecheck){
        if (str.charAt(0)>='A' && str.charAt(0)<='T' && str.charAt(1)>='0' && str.charAt(1)<='9'){
            var gy = str.charCodeAt(0) - 64;
            if (gy > 8) gy--;
            var gx = str.charCodeAt(1) - 48;
            var t = str.charCodeAt(2) - 48;
            if (t >= 0 && t <=9) gx = gx * 10 + t;
            aiplay(20 - gx, gy);
            doublecheck = false;
        }
        else if (str.slice(0, 4) == "pass"){
            aipass();
            doublecheck = false;
        }
    }
    else doublecheck = false;
})

lz.stdout.on('close', () => {
    console.log("lz process ends.");
})

var bookq = new Array(71);
var booka = new Array(71);
var bookn = new Array(71);
var rl = new Array(71);
for (var i = 0; i < 71; i++) {
    bookq[i] = [];
    booka[i] = [];
    bookn[i] = 0;
    
}
function loadbook(i) {
    if (i<70){
        var oddline = true;
        
        var rl = readline.createInterface({
            input: fs.createReadStream(path.join(__dirname, 'go_modules/open/') + i + ".opn")
        });
        rl.on('line', function (line) {
            if (oddline) bookq[i][bookn[i]] = line;
            else {
                booka[i][bookn[i]] = line;
                bookn[i]++;
            }
            oddline = !oddline;
        });
        rl.on('close', function(){
            console.log("BOOK " + i + " LOADED.");
            delete rl;
            loadbook(i+1);
        })
    }
    else console.log("LOADING BOOKS FINISHED.")
}
loadbook(0);

function book(c){
    var m = Game.Getmn();
    var bsm = Game.Getbsm();
    var returnvalue = true;
    var stop = false;
    for (var i = 0; i < bookn[m]; i++){
        for (var j = 0; j < 8; j++){
            if (bookq[m][i] == bsm[j]){
                stop = true;
                if (booka[m][i].charAt(0) != '0'){
                    bookplay(booka[m][i], j, c);
                    returnvalue = false;
                }
                break;
            }
        }
        if (stop) break;
    }
    return(returnvalue);
}

function rotaplay(x, y, r){
    console.log(r);
    if (r == 0) aiplay(x, y);
    else if (r == 1) aiplay(y, x);
    else if (r == 2) aiplay(x, 20 - y);
    else if (r == 3) aiplay(20 - y, x);
    else if (r == 4) aiplay(20 - x, y);
    else if (r == 5) aiplay(y, 20 - x);
    else if (r == 6) aiplay(20 - x, 20 - y);
    else if (r == 7) aiplay(20 - y, 20 - x);
    var command = "play " + Game.Getgtpm()[0] + " " + Game.Getgtpm()[1] + "\n";
    lz.stdin.write(command);
    var m = Game.Getmn();
    var outstr = "BOOK MOVE:  " + m + " ";
    if (m < 10) outstr += " ";
    con.webContents.send('constr', outstr + Game.Getgtpm()[0] + " " + Game.Getgtpm()[1] + "\n");
}
function bookplay(rawstr, sym, c){
    console.log("Find Move");
    console.log(rawstr);
    var n = Math.floor(Math.random() * (rawstr.charCodeAt(0) - 48));
    console.log(n)
    var spaceindex = 0;
    for (var i = 0; i < rawstr.length; i++){
        if (rawstr[i] == " ") {
            if (spaceindex == n){
                var str = rawstr.slice(i+1, i+4);
                var by = str.charCodeAt(0) - 96;
                if (by > 8) by--;
                var bx = str.charCodeAt(1) - 48;
                var t = str.charCodeAt(2) - 48;
                if (t >= 0 && t <=9) bx = bx * 10 + t;
                rotaplay(20 - bx, by, sym);
                break;
            }
            else spaceindex++;
        }
    }
}

function lzPlay(c){
    if (Game.Getmn() == 0){
        if (Math.random() < 0.5){
            aiplay(4, 17);
            lz.stdin.write("play B R16\n");
            con.webContents.send('constr', "BOOK MOVE:  1  B R16\n");
        }
        else {
            aiplay(4, 16);
            lz.stdin.write("play B Q16\n");
            con.webContents.send('constr', "BOOK MOVE:  1  B Q16\n");
        }
    }
    else if (Game.Getmn()<70){
        console.log("START SEARCHING BOOK...");
        if (book(c)) {
            console.log("what happens...")
            lz.stdin.write("genmove " + c +"\n");
        }
    }
    else lz.stdin.write("genmove " + c +"\n");
}

ipcMain.on('wins', (event) => {
    win.setSize(642, 642);
    conposx = 652;
});
ipcMain.on('winl', (event) => {
    win.setSize(833, 833);
    conposx = 843;
});

function aiplay(x, y){
    Game.Play(x, y);
    if (Game.Getas() == "VALID") win.webContents.send('newmove', {s: Game.Getbs(), m: Game.Getmn(), k: Game.Getkl()});
}
function aipass(){
    Game.Pass();
    win.webContents.send('newmove', {s: Game.Getbs(), m: Game.Getmn(), k: Game.Getkl()});
}

ipcMain.on('play', (event, x, y, ai) => {
    Game.Play(x, y);
    if (Game.Getas() == "VALID"){
        win.webContents.send('newmove', {s: Game.Getbs(), m: Game.Getmn(), k: Game.Getkl()});
        var command = "play " + Game.Getgtpm()[0] + " " + Game.Getgtpm()[1] + "\n";
        lz.stdin.write(command);
    }
    if (ai == 0 && Game.Getgtpm()[0] == "W") lzPlay("B");
    else if (ai == 1 && Game.Getgtpm()[0] == "B") lzPlay("W");
})
ipcMain.on('pass', (event, ai) => {
    Game.Pass();
    win.webContents.send('newmove', {s: Game.Getbs(), m: Game.Getmn(), k: Game.Getkl()});
    var command = "play " + Game.Getgtpm()[0] + " " + Game.Getgtpm()[1] + "\n";
    lz.stdin.write(command);
    if (ai == 0 && Game.Getgtpm()[0] == "W") lzPlay("B");
    else if (ai == 1 && Game.Getgtpm()[0] == "B") lzPlay("W");
});
ipcMain.on('lplay', (event, c) => {
    if (c == 0 && (Game.Getmn() == 0 || Game.Getgtpm()[0] == "W")) lzPlay("B");
    else if (c == 1 && Game.Getgtpm()[0] == "B") lzPlay("W");
});
ipcMain.on('ltime', (event, t) => {
    t++;
    lz.stdin.write("time_settings 0 " + t + " 1\n");
});
ipcMain.on('undo', (event) => {
    Game.Undo();
    win.webContents.send('back', {s: Game.Getbs(), m: Game.Getmn()});
    lz.stdin.write("undo\n");
});
ipcMain.on('restart', (evnet) => {
    Game.CleanBoard();
    win.webContents.send('back', {s: Game.Getbs(), m: Game.Getmn()});
    lz.stdin.write("clear_board\n");
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (win === null) createWindow();
});