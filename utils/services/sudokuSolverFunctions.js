export function isValidMove(row, col, val, board){

    for(let i=0; i < 9; i++){
        if(board[i][col] === val)
            return false;
    }

    for(let i=0; i < 9; i++){
        if(board[row][i] === val)
            return false;
    }

    let colQuadrant = Math.floor(col / 3)*3;
    let rowQuadrant = Math.floor(row / 3)*3;

    for(let i=rowQuadrant; i < rowQuadrant+3; i++){
        for(let j=colQuadrant; j < colQuadrant+3; j++){
            if(board[i][j] === val)
                return false;
        }
    }

    return true;
}

export function solveSudoku(row, col, board){
    if(col > 8){
        row = row + 1;
        col = 0;
    }

    if(row > 8)
        return board;

    if(board[row][col] > 0)
       return solveSudoku(row, col+1, board);

    for(let val = 1; val <= 9; val++){
        if(isValidMove(row, col, val, board)){
            board[row][col] = val;
            solveSudoku(row, col+1, board);
            if(isSolved(board))
                return board;
        }
        board[row][col] = 0;
    }

    return board;
}

export function isSolved(board){
    let expectedSum = 1+2+3+4+5+6+7+8+9;

    for(let row=0; row< 9; row++){
        let sum = 0;
        for(let col=0; col<9; col++){
            sum += board[row][col];
        }
        if(sum !== expectedSum)
            return false;
    }

    for(let col=0; col< 9; col++){
        let sum = 0;
        for(let row=0; row<9; row++){
            sum += board[row][col];
        }
        if(sum !== expectedSum)
            return false;
    }

    for(let rowQuadrant = 0; rowQuadrant < 3; rowQuadrant++){
        for(let colQuadrant =0; colQuadrant < 3; colQuadrant++){
            let sum = 0;
            for(let row=rowQuadrant*3; row < rowQuadrant*3+3; row++){
                for(let col=colQuadrant*3; col < colQuadrant*3+3; col++){
                    sum += board[row][col];
                }
            }
            if(sum !== expectedSum)
                return false;
        }
    }

    return true;
}