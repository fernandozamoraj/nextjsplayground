import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import Link from 'next/link';
import { solveSudoku } from './services/sudokuSolverFunctions';

const INITIAL_BOARD = 
[ [0, 1, 0, 0, 2, 0, 0, 9, 0],  //1
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //2
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //2
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //3 
  [0, 0, 0, 8, 0, 0, 0, 0, 0],  //4
  [0, 0, 0, 0, 0, 0, 0, 3, 0],  //5
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //6
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //7
  [0, 0, 0, 0, 0, 0, 0, 0, 0],  //8
  [0, 0, 0, 0, 0, 0, 0, 0, 0]   //9
];  //2

const SudokuSolver = () =>{

    const [board, setBoard] = useState(INITIAL_BOARD);

    const updateBoard = (row, col, value) =>{
        if(value < 0 || value > 9)
            value = 0;

        let newBoard = cloneBoard();
        
        newBoard[row][col] = value;
        setBoard(newBoard);
    }

    const solvePuzzle = () =>{
        let newBoard = cloneBoard();
        
        newBoard = solveSudoku(0,0,newBoard);

        setBoard(newBoard);
    }

    const cloneBoard = () =>{
        let newBoard = [...board];
        let i = 0;
        for(let row of board){
            newBoard[i] = [...row];
            i++;
        }

        return newBoard;
    }

    let boardElements = [];
    for(let i=0; i<9;i++){
        boardElements[i] = board[i].map( (x, j)=>{
            return(<div className="col-1">
                    <NumericInput 
                        style={false} 
                        type="text" 
                        className="form-control" 
                        id={`board-${i}-${j}`} 
                        key={`board-${i}-${j}`} 
                        placeholder="0" 
                        value={x}
                        onChange={ value => updateBoard(i, j, value)}
                        />
                </div>)
        });
    }

    return (
    <div className="container">
        <Link href="/">
            <a>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
        <div className="row" className="styles.card">
            <h2>Sudoku solver </h2>
            <p>Plug in the numbers that your puzzle has and click solve</p>
        </div>
        <div className="row">
            <div className="col-6">
                <button
                    className="btn btn-primary"
                    type="button"
                    id="ammortizationCalculate"
                    aria-expanded="false"
                    onClick={ () => solvePuzzle()}
                > Solve </button>   
            </div>
        </div>

        <div className="row gx-5 form-group">
            <div className="row">
                {boardElements[0]}
            </div>
            <div className="row">
                {boardElements[1]}
            </div>
            <div className="row">
                {boardElements[2]}
            </div>
            <div className="row">
                {boardElements[3]}
            </div>
            <div className="row">
                {boardElements[4]}
            </div>
            <div className="row">
                {boardElements[5]}
            </div>
            <div className="row">
                {boardElements[6]}
            </div>
            <div className="row">
                {boardElements[7]}
            </div>
            <div className="row">
                {boardElements[8]}
            </div>
        </div>
    </div>);

}

export default SudokuSolver;