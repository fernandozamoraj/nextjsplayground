import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import Link from 'next/link';
import { solveSudoku, isValidMove } from '../utils/services/sudokuSolverFunctions';

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
    const [validationMessage, setValidationMessage] = useState('');

    const updateBoard = (row, col, value) =>{
        if(value < 0 || value > 9)
            value = 0;

        let newBoard = cloneBoard();

        if(isValidMove(row, col, value, newBoard)){
            newBoard[row][col] = value;
            setBoard(newBoard);
            setValidationMessage('');
        }
        else{
            newBoard[row][col] = 0;
            setBoard(newBoard);
            setValidationMessage(`Invalid move ${value} on cell [${row+1},${col+1}]`);
        }
    }

    const solvePuzzle = () =>{
        let newBoard = cloneBoard();
        
        newBoard = solveSudoku(0,0,newBoard);

        setBoard(newBoard);

        setValidationMessage(`Invalid move ${value} on cell [${row+1},${col+1}]`);
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
            let padding = 0;

            if(((j+1)%3) == 0){
                padding = 25;
            }
            return(<div key={`board-element-${i}-${j}`} className={`col-1`} style={{width: 100, padding: 0, marginRight: padding}}>
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
    <div className="container bg-lighter text-secondary">
        <Link href="/">
            <a>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
        <div className="row pb-5">
            <div className="col-1"></div>
            <div className="col-8 jumbotron text-center">
                <h2 text-primary>Sudoku solver </h2>
                <p>Plug in the numbers that your puzzle has and click solve</p>
                <p>
                <button
                    
                    style={{width:'100%', padding: 20, margin: 0 }}
                    className="btn btn-info text-white"
                    type="button"
                    id="button-solve-sudoku"
                    aria-expanded="false"
                    onClick={ () => solvePuzzle()}
                > <h2>Solve</h2> </button>   
                </p>
            </div>
        </div>
        <div className="row pb-5 text-danger">
            <div className="col-1"></div>
            <div className="col-10">
                <h2>{validationMessage}</h2>
            </div>
        </div>

        <div className="row pb-5 text-primary">
            <div className="col-1"/>
            <div className="col-10">
                <div className="row gx-5 form-group">
                    <div className="row pb-4">
                        <div className="row">
                            {boardElements[0]}
                        </div>
                        <div className="row">
                            {boardElements[1]}
                        </div>
                        <div className="row">
                            {boardElements[2]}
                        </div>
                    </div>

                    <div className="row pb-4">
                        <div className="row">
                            {boardElements[3]}
                        </div>
                        <div className="row">
                            {boardElements[4]}
                        </div>
                        <div className="row">
                            {boardElements[5]}
                        </div>
                    </div>

                    <div className="row">
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
                </div>
            </div>
        </div>
    </div>);

}

export default SudokuSolver;