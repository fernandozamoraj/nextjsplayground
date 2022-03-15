import { useState } from 'react';
import { solveTowersOfHanoi } from '../utils/services/towersOfHanoiAlgorithm';
import BackLink from '../comps/backLink';
import DiscStack from '../comps/towersOfHanoi/discStack';
import MovesPanel from '../comps/towersOfHanoi/movesPanel';
import ButtonsPanel from '../comps/towersOfHanoi/buttonsPanel';

const TowersOfHanoi = () =>{

    //TODO: change to use one state instead of multiple
    const [towers, setTowers] = useState({A:[6,5,4,3], B: [], C: []});
    const [moves, setMoves] = useState([]);
    const [movesHistory, setMovesHistory] = useState([]);

    const handleSolution = () =>{
        let temporaryMoves = [];

        solveTowersOfHanoi(4, temporaryMoves);
        setMoves([...temporaryMoves]);
        setMovesHistory([]);
        setTowers({A:[6,5,4,3], B: [], C: []});
    };

    const unsolved = () =>{
        return moves.length === 0 && movesHistory.length == 0;
    }

    const handleNextMove = () =>{
        if(unsolved()){
            handleSolution();
        }

        if(moves.length > 0){
            let tempMoves = [...moves];
            let tempMovesHistory = [...movesHistory];
            let nextMove = tempMoves.shift();
            let tempTowers = {...towers};
            let disk = tempTowers[nextMove.from].pop();
            tempTowers[nextMove.to].push(disk);
            tempMovesHistory.unshift({...nextMove});
    
            setTowers(tempTowers);
            setMoves(tempMoves);
            setMovesHistory(tempMovesHistory);
        }
    };

    const handlePreviousMove = () =>{
        if(unsolved()){
            handleSolution();
        }

        if(movesHistory.length > 0){
            let tempMoves = [...moves];
            let tempMovesHistory = [...movesHistory];
            let nextMove = tempMovesHistory.shift();
            let tempTowers = {...towers};
            let disk = tempTowers[nextMove.to].pop();
            tempTowers[nextMove.from].push(disk);
            tempMoves.unshift({...nextMove});
    
            setTowers(tempTowers);
            setMoves(tempMoves);
            setMovesHistory(tempMovesHistory);
        }
    };

    return(
    <div className="container bg-lighter text-secondary">
        <BackLink/>
        <div className="row pb-5">
            <div className="col-sm-1"></div>
            <ButtonsPanel onHandleNextMove={handleNextMove} onHandlePreviousMove={handlePreviousMove} onHandleSolution={handleSolution} />
            <DiscStack towers={towers}/>
            <MovesPanel moves={moves} movesHistory={movesHistory}/>
        </div>
    </div>
    );

};


export default TowersOfHanoi;

