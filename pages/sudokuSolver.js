import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import { solveSudoku, isValidMove } from '../utils/services/sudokuSolverFunctions';
import BackLink from '../comps/backLink';
import ActionButton from '../comps/actionButton';

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

    const [dashboard, setDashboard] = useState({board: INITIAL_BOARD, validationMessage: ""});
    
    const updateBoard = (row, col, value) =>{
        if(value < 0 || value > 9)
            value = 0;

        let newBoard = cloneBoard();

        if(isValidMove(row, col, value, newBoard)){
            newBoard[row][col] = value;
            setDashboard({board: newBoard, validationMessage:''});
        }
        else{
            newBoard[row][col] = 0;
            setDashboard({board: newBoard, validationMessage:`Invalid move ${value} on cell [${row+1},${col+1}]`});
        }
    }

    const solvePuzzle = () =>{
        let newBoard = cloneBoard();
        
        newBoard = solveSudoku(0,0,newBoard);

        setDashboard({board: newBoard, validationMessage:''});
    }

    const cloneBoard = () =>{
        let newBoard = [...dashboard.board];
        let i = 0;
        for(let row of dashboard.board){
            newBoard[i] = [...row];
            i++;
        }

        return newBoard;
    }

    let boardElements = [];
    for(let i=0; i<9;i++){
        boardElements[i] = dashboard.board[i].map( (x, j)=>{
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

    const getFullHorizontalRowPanel = (startingIndex) =>{

        return (
            <div className="row pb-4">
                <div className="row">
                    {boardElements[startingIndex]}
                </div>
                <div className="row">
                    {boardElements[startingIndex+1]}
                </div>
                <div className="row">
                    {boardElements[startingIndex+2]}
                </div>
            </div>
        );
    }

    return (
        <div className="container bg-lighter text-secondary">
            <BackLink/>
            <div className="row pb-5">
                <div className="col-1"></div>
                <div className="col-8 jumbotron text-center">
                    <h2 text-primary>Sudoku solver </h2>
                    <p>Plug in the numbers and click solve</p>
                    <ActionButton onClick={()=>solvePuzzle()} text="Solve" />
                </div>
            </div>
            <div className="row pb-5 text-danger">
                <div className="col-1"></div>
                <div className="col-10">
                    <h2>{dashboard.validationMessage}</h2>
                </div>
            </div>

            <div className="row pb-5 text-primary">
                <div className="col-1"/>
                <div className="col-10">
                    <div className="row gx-5 form-group">
                        {getFullHorizontalRowPanel(0)}
                        {getFullHorizontalRowPanel(3)}
                        {getFullHorizontalRowPanel(6)}
                    </div>
                </div>
            </div>
        </div>);
}

export default SudokuSolver;