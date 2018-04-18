const BOARDSIZE = 19;
const BOARDPLUS = 20; // BOARDPLUS = BOARDSIZE + 1
function New2DArray() {
    var arr = new Array(BOARDSIZE + 2);
    for (var i = 0; i < (BOARDSIZE + 2); i++) {
        arr[i] = [];
    }
    return arr;
}
function Set2DArray(arr)
{
    for (var i = 0; i < (BOARDSIZE + 2) ; i++)
        for (var j = 0; j < (BOARDSIZE + 2) ; j++) {
            arr[i][j] = 0;
        }
}
function Copy2DArray(cloArr, oriArr) {
    for (var i = 0; i < (BOARDSIZE + 2) ; i++) {
        cloArr[i] = oriArr[i].slice(0);
    }
}
function Compare2DArray(arr1, arr2)
{
    for (var i = 0; i < (BOARDSIZE + 2) ; i++)
        for (var j = 0; j < (BOARDSIZE + 2) ; j++)
            if (arr1[i][j] != arr2[i][j]) return false;
    return true;
}

class goBoard {
    constructor(){
        this.NumToChar = ["(", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n",
                          "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "W", "B", ")"]; // For making sgf file
        this.NumToGtp = ["", "A", "B", "C", "D", "E", "F", "G", "H", "J",
                        "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];
        this.stone = New2DArray(); // Stone: 0 means Empty. 1 means Black. 2 means White. <0 means Out of Board.
        this.shape = New2DArray(); // Shape: All points of the SAME Shape = MoveNum of the LAST Move in that Shape.
        this.MoveNum = 0;
        this.handiMove = 0;
        this.handiShape = 0;
        this.handiCount = 0;
        this.kills = 0; // Number of stones dead in this turn
        this.blackDeadSum = [];
        this.whiteDeadSum = [];
        this.valid = false;
        this.xrow = 0; // Y-Coordinate of Current Move  Yes, [Y]-coordinate
        this.ycol = 0; // X-Coordinate of Current Move
        this.stoneHistory = [];
        this.shapeHistory = [];
        this.boardString = "";
        this.boardSymmetry = [];
        this.alertString = "";
        this.moveHistory = []; // sgf format
        this.sgfString = "(;";  // For preparing download
        this.gtpString = new Array(500);
        for (var i = 0; i < 500; i++) {
            this.gtpString[i] = new Array(2);
        }
        
        for (var i = 0; i <= BOARDSIZE * BOARDSIZE + 100; i++) {
            this.stoneHistory[i] = New2DArray();
            this.shapeHistory[i] = New2DArray();
        }
        Set2DArray(this.stoneHistory[0]);
        Set2DArray(this.shapeHistory[0]);
        this.countingMove = 5;
        this.blackOwn = false;
        this.whiteOwn = false;
        this.whosPoint = [0, 0]; // whosPoint[0] means black; whosPoint[1] means white
        this.Initial();
    }
    
    AddToGtp() {
        this.gtpString[this.MoveNum][0] = this.NumToChar[this.MoveNum % 2 + 27];
        this.gtpString[this.MoveNum][1] = this.NumToGtp[this.ycol] + (20 - this.xrow);
    }
    AddToSgf() {
        this.moveHistory[this.MoveNum] = ";" + this.NumToChar[this.MoveNum % 2 + 27] + "[" + this.NumToChar[this.ycol] + this.NumToChar[this.xrow] + "]";
        this.sgfString += this.moveHistory[this.MoveNum];
    }
    SaveHistory() {
        Copy2DArray(this.stoneHistory[this.MoveNum], this.stone);
        Copy2DArray(this.shapeHistory[this.MoveNum], this.shape);
    }
    ChangeHistory(jumpMoveNum, max) {
        for (var i = jumpMoveNum + 1; i <= max; i++) {
            Set2DArray(this.stoneHistory[i]);
            Set2DArray(this.shapeHistory[i]);
            this.moveHistory[i] = "";
            this.blackDeadSum[i] = 0;
            this.whiteDeadSum[i] = 0;
        }
        this.MoveNum = jumpMoveNum;
        this.sgfString = this.sgfString.slice(0, this.MoveNum * 6 + this.handiCount + 1);
        if (this.MoveNum > 0) {
            Copy2DArray(this.stone, this.stoneHistory[this.MoveNum]);
            Copy2DArray(this.shape, this.shapeHistory[this.MoveNum]);
        } 
    }
    InitialTool(arr, value, ii) {
        arr[0][ii] = value; arr[20][ii] = value;
        arr[ii][0] = value; arr[ii][20] = value;
    }
    Initial() { // Initialize the Board
        Set2DArray(this.stone);
        Set2DArray(this.shape);
        for (var i = 0; i < 21; i++) {
            this.InitialTool(this.stone, -2, i);
            this.InitialTool(this.shape, -2, i);
        }
        this.ChangeHistory(0, BOARDSIZE * BOARDSIZE + 100);
        this.MoveNum = 0;
        this.curxr = [];
        this.curyc = [];
        this.handiMove = 0;
        this.handiShape = 0;
        this.handiCount = 0;
        this.blackDeadSum[0] = 0;
        this.whiteDeadSum[0] = 0;
        this.blackDeadSum = this.blackDeadSum.slice(0, 1);
        this.whiteDeadSum = this.whiteDeadSum.slice(0, 1);
        this.moveHistory = this.moveHistory.slice(0, 1);
        this.moveHistory[0] = "(";
        this.sgfString = "(;";
        this.gtpString[0][0] = "";
        this.gtpString[0][1] = "";
    }

    RefreshPrisoners() {
        this.blackDeadSum[this.MoveNum] = (this.MoveNum + 1) % 2 * this.kills + this.blackDeadSum[this.MoveNum - 1];
        this.whiteDeadSum[this.MoveNum] =  this.MoveNum % 2 * this.kills+ this.whiteDeadSum[this.MoveNum - 1];
    }
    RefreshBoard() {
        this.boardString = "";
        for (var i = 0; i < 8; i++) this.boardSymmetry[i] = "";
        var color = "B";
        if (this.MoveNum % 2 == 0) color = "W";
        for (var i = 1; i <= BOARDSIZE; i++)
            for (var j = 1; j <= BOARDSIZE; j++){
                if ((i == this.curxr[this.MoveNum]) && (j == this.curyc[this.MoveNum]))
                    this.boardString += color;
                else this.boardString += this.stone[i][j];

                this.boardSymmetry[0] += this.stone[i][j];
                this.boardSymmetry[1] += this.stone[j][i];
                this.boardSymmetry[2] += this.stone[i][BOARDPLUS - j];
                this.boardSymmetry[3] += this.stone[BOARDPLUS - j][i];
                this.boardSymmetry[4] += this.stone[BOARDPLUS - i][j];
                this.boardSymmetry[5] += this.stone[j][BOARDPLUS - i];
                this.boardSymmetry[6] += this.stone[BOARDPLUS - i][BOARDPLUS - j];
                this.boardSymmetry[7] += this.stone[BOARDPLUS - j][BOARDPLUS - i];
            }
    }
    CleanBoard() {
        this.Initial();
        this.RefreshBoard();
    }
    setHandicap(handicap) {
        if (this.MoveNum > 0) this.alertString = "You can only set handicap stones at the BEGINNING of a game.\nPlease click [Start Over] button to start a new game first.";
        else if (Number(handicap) > 1 && Number(handicap) < 10) {
            this.sgfString = "(;;HA[" + handicap + "]AB";
            this.handicap = Number(handicap);
            this.handiCount = handicap * 4 + 8;
            this.handiShape = handicap * 2 - 2;
            if (handicap >= 2) {
                this.stone[4][16] = 1; this.stone[16][4] = 1;
                this.shape[4][16] = 1; this.shape[16][4] = 3;
                this.sgfString += "[dp][pd]";
            }
            if (handicap == 3) {
                this.stone[10][10] = 1;
                this.shape[10][10] = 5;
                this.sgfString += "[jj]";
            }
            if (handicap >= 4) {
                this.stone[4][4] = 1; stone[16][16] = 1;
                this.shape[4][4] = 5; shape[16][16] = 7;
                this.sgfString += "[pp][dd]";
            }
            if (handicap == 5) {
                this.stone[10][10] = 1;
                this.shape[10][10] = 9;
                this.sgfString += "[jj]";
            }
            if (handicap >= 6) {
                this.stone[10][4] = 1; stone[10][16] = 1;
                this.shape[10][4] = 9; shape[10][16] = 11;
                this.sgfString += "[dj][pj]";
            }
            if (handicap == 7) {
                this.stone[10][10] = 1;
                this.shape[10][10] = 13;
                this.sgfString += "[jj]";
            }
            if (handicap >= 8) {
                this.stone[4][10] = 1; stone[16][10] = 1;
                this.shape[4][10] = 13; shape[16][10] = 15;
                this.sgfString += "[jp][jd]";
            }
            if (handicap == 9) {
                this.stone[10][10] = 1;
                this.shape[10][10] = 17;
                this.sgfString += "[jj]";
            }
            this.sgfString += "PL[W]";
            this.moveHistory[0] = this.sgfString;
            Copy2DArray(this.stoneHistory[0], this.stone); Copy2DArray(this.stoneHistory[1], this.stone);
            Copy2DArray(this.shapeHistory[0], this.shape); Copy2DArray(this.shapeHistory[1], this.shape);
            this.MoveNum++;
            this.handiMove = 1;
            this.blackDeadSum[1] = 0;
            this.whiteDeadSum[1] = 0;
            this.RefreshBoard();
        }
        else if (handicap > 9) this.alertString = "You cannot set handicap stones greater than 9";
        else if (handicap != 1) this.alertString = "Please enter a Valid Handicap Stone Number";
    }
    MoveJump(jumpNum) {
        jumpNum += this.handiMove;
        if (jumpNum === 0) this.CleanBoard();
        if (jumpNum > 0 && jumpNum < this.MoveNum) {
            this.ChangeHistory(jumpNum, this.MoveNum);
            this.RefreshBoard();
        }
        else if (jumpNum != this.MoveNum) this.alertString = "Please enter a Valid Jump Move, which should be no less than 0 and no greater than the current Move Number.";
    }
    Undo() { this.MoveJump(this.MoveNum - this.handiMove - 1); }

    CheckShapeTool(xx, yy) { // Used only for CheckShape
        if (this.shape[this.xrow+xx][this.ycol+yy] > 0 && this.shape[this.xrow+xx][this.ycol+yy] < this.MoveNum + this.handiShape && this.shape[this.xrow+xx][this.ycol+yy] % 2 == this.MoveNum % 2) {
            var Temp = this.shape[this.xrow+xx][this.ycol+yy];
            for (var i = 1; i <= BOARDSIZE; i++)
                for (var j = 1; j <= BOARDSIZE; j++)
                    if (this.shape[i][j] == Temp) this.shape[i][j] = this.MoveNum + this.handiShape;
        }
    }
    CheckShape() { // Change the Shape Data according to the Last Move
        this.shape[this.xrow][this.ycol] = this.MoveNum + this.handiShape;
        this.CheckShapeTool(1, 0);
        this.CheckShapeTool(0, 1);
        this.CheckShapeTool(0, -1);
        this.CheckShapeTool(-1, 0);
    }

    IfAdjacent(shapeNum, ii, jj) {
        if (this.shape[ii - 1][jj] == shapeNum || this.shape[ii + 1][jj] == shapeNum ||
            this.shape[ii][jj - 1] == shapeNum || this.shape[ii][jj + 1] == shapeNum)
             return true;
        else return false;
    }
    CountQi(shapeNum) {
        var cQi = 0;
        for (var i = 1; i <= BOARDSIZE; i++) // Check alive or not
            for (var j = 1; j <= BOARDSIZE ; j++)
                if (this.stone[i][j] == 0 && this.IfAdjacent(shapeNum, i, j))
                    cQi++;
        return cQi;
    }
    RemoveStone(deathNumber) {
        this.valid = true;
        for (var i = 1; i < 20; i++) // Remove dead stones
            for (var j = 1; j < 20; j++)
                if (this.shape[i][j] == deathNumber) {
                    this.stone[i][j] = 0;
                    this.shape[i][j] = 0;
                    this.kills++;
                }
    }
    CheckDeathTool(deathNum, isTest) {
        var qQi = this.CountQi(deathNum);
        if (qQi == 0) {
            if (isTest) return false;
            else this.RemoveStone(deathNum);
        }
        else return true;
    }
    CheckDeath() { // Check if the Last Move Kills any Shape
        if (this.stone[this.xrow + 1][this.ycol] > 0 && this.stone[this.xrow + 1][this.ycol] != this.stone[this.xrow][this.ycol])
            this.CheckDeathTool(this.shape[this.xrow + 1][this.ycol], false);
        if (this.stone[this.xrow - 1][this.ycol] > 0 && this.stone[this.xrow - 1][this.ycol] != this.stone[this.xrow][this.ycol] &&
            this.shape[this.xrow - 1][this.ycol] != this.shape[this.xrow + 1][this.ycol])
            this.CheckDeathTool(this.shape[this.xrow - 1][this.ycol], false);
        if (this.shape[this.xrow][this.ycol + 1] > 0 && this.stone[this.xrow][this.ycol + 1] != this.stone[this.xrow][this.ycol] &&
            this.shape[this.xrow][this.ycol + 1] != this.shape[this.xrow + 1][this.ycol] && this.shape[this.xrow][this.ycol + 1] != this.shape[this.xrow - 1][this.ycol])
            this.CheckDeathTool(this.shape[this.xrow][this.ycol + 1], false);
        if (this.shape[this.xrow][this.ycol - 1] > 0 && this.stone[this.xrow][this.ycol - 1] != this.stone[this.xrow][this.ycol] &&
            this.shape[this.xrow][this.ycol - 1] != this.shape[this.xrow + 1][this.ycol] && this.shape[this.xrow][this.ycol - 1] != this.shape[this.xrow - 1][this.ycol] && this.shape[this.xrow][this.ycol - 1] != this.shape[this.xrow][this.ycol + 1])
            this.CheckDeathTool(this.shape[this.xrow][this.ycol - 1], false);
    }
    Pass() {
        this.xrow = 0;
        this.ycol = 0;
        this.MoveNum++;
        this.curxr[this.MoveNum] = 0;
        this.curyc[this.MoveNum] = 0;
        this.kills = 0;
        this.RefreshPrisoners();
        this.RefreshBoard();
        this.SaveHistory();
        this.moveHistory[this.MoveNum] = ";" + this.NumToChar[this.MoveNum % 2 + 27] + "[  ]";
        this.sgfString += this.moveHistory[this.MoveNum];
        this.gtpString[this.MoveNum][0] = this.NumToChar[this.MoveNum % 2 + 27];
        this.gtpString[this.MoveNum][1] = "PASS";
        this.alertString = "VALID";
    }
    Play(x, y) {
        this.xrow = Number(x);
        this.ycol = Number(y);
        if (this.stone[this.xrow][this.ycol] == 0) {
            var tempShape = New2DArray();
            var tempStone = New2DArray();
            Copy2DArray(tempStone, this.stone);
            Copy2DArray(tempShape, this.shape);
            this.stone[this.xrow][this.ycol] = this.MoveNum % 2 + 1;
            this.MoveNum++;
            this.valid = false;
            this.CheckShape();
            this.CheckDeath();
            if (this.kills == 1 && this.MoveNum > 1 && this.stone[this.xrow][this.ycol] == this.stoneHistory[this.MoveNum - 2][this.xrow][this.ycol] && Compare2DArray(this.stone, this.stoneHistory[this.MoveNum - 2])) {
                Copy2DArray(this.stone, tempStone);
                Copy2DArray(this.shape, tempShape);
                this.MoveNum--;
                this.alertString = "This is a Ko. You must play somewhere first before playing this move.";
            }
            else if (this.valid || this.CheckDeathTool(this.MoveNum + this.handiShape, true)) {
                this.alertString = "VALID";
                this.curxr[this.MoveNum] = x;
                this.curyc[this.MoveNum] = y;
                this.RefreshPrisoners();
                this.RefreshBoard();
                this.SaveHistory();
                this.AddToSgf();
                this.AddToGtp();
            }
            else {
                this.stone[this.xrow][this.ycol] = 0;
                Copy2DArray(this.shape, tempShape);
                this.MoveNum--;
                this.alertString = "ERROR: This is NOT a Leagal Move, since this move will kill your own stones.";
            }
        }
        else this.alertString = "ERROR: This is NOT a Leagal Move, since the position is either occupied already or out of board.";
        this.kills = 0;
    }


    Getmn(){ return (this.MoveNum); }
    Gethm(){ return (this.handiMove); }
    Getkl(){ return (this.kills); }
    Getbd(){ return (this.blackDeadSum[this.MoveNum]); }
    Getwd(){ return (this.whiteDeadSum[this.MoveNum]); }
    Getbs(){ return (this.boardString); }
    Getbsm(){ return (this.boardSymmetry); }
    Getas(){ return (this.alertString); }
    Getsgf(){ return (this.sgfString); }
    Getgtps(){ return (this.gtpString); }
    Getgtpm(){ return (this.gtpString[this.MoveNum]); }
}

module.exports = goBoard;