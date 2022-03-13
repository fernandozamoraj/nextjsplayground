import { useState } from 'react';
import Link from 'next/link';
import { solveTowersOfHanoi } from '../utils/services/towersOfHanoiAlgorithm'


const TowersOfHanoi = () =>{

    const [towers, setTowers] = useState({A:[6,5,4,3], B: [], C: []});
    const [moves, setMoves] = useState([]);

    const handleSolution = () =>{
        let temporaryMoves = [];

        solveTowersOfHanoi(4, temporaryMoves);
        setMoves([...temporaryMoves]);
        setTowers({A:[6,5,4,3], B: [], C: []});
    };

    const handleNextMove = () =>{
        if(moves.length > 0){
            let tempMoves = [...moves];
            let nextMove = tempMoves.shift();
            let tempTowers = {...towers};
            let disk = tempTowers[nextMove.from].pop();
            tempTowers[nextMove.to].push(disk);
    
            setTowers(tempTowers);
            setMoves(tempMoves);
        }
    };

    const getDiskStack = (col, disks, towerHeight) =>{

        let newDisks = [];

        while(disks.length > 0){
            newDisks.push(disks.pop());
        }

        while(newDisks.length < towerHeight){
            newDisks.unshift(-1);
        }
        const colorClasses = ['bg-primary', 'bg-danger', 'bg-success', 'bg-warning', 'bg-info'];
        return (
            newDisks.map( (x, index) =>{
                const colorClass = x !== -1 ? colorClasses[x%5] : "bg-secondary";
                const colSize = x !== -1 ? x*2 : 2;
                const colOffset = x !== -1 ? (12 - (x*2))/2 : 5;
                return (
                 <div className="row" key={`${col}-disk-${index}`}>
                    <div className={`col-sm-${colSize} offset-sm-${colOffset} ${colorClass}`}><span>&nbsp;</span></div>    
                 </div>);    
              })
        );
    }

    return(
    <div className="container bg-lighter text-secondary">
        <Link href="/">
            <a>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
        <div className="row pb-5">
            <div className="col-1"></div>
            <div className="col-8 jumbotron text-center">
                <h2 className="text-primary">Towers of Hanoi </h2>
                <p>Solve the towers</p>
                <p>
                <button
                    style={{width:'100%', padding: 20, margin: 0 }}
                    className="btn btn-info text-white"
                    type="button"
                    id="ammortizationCalculate"
                    aria-expanded="false"
                    onClick={ handleSolution }
                > <h2>Solve</h2> </button>   
                </p>
                <p>
                <button
                    
                    style={{width:'100%', padding: 20, margin: 0 }}
                    className="btn btn-info text-white"
                    type="button"
                    id="ammortizationCalculate"
                    aria-expanded="false"
                    onClick={ handleNextMove }
                > <h2>Next</h2> </button>   
                </p>

            </div>
            <div className="container">
                <div className="row">
                    <div className="col-sm">
                        {getDiskStack('A', [...towers.A], 7)}
                    </div>
                    <div className="col-sm">
                        {getDiskStack('B', [...towers.B], 7)}
                    </div>
                    <div className="col-sm">
                        {getDiskStack('C', [...towers.C], 7)}
                    </div>
                </div>
            </div>

                <ul>
                    {moves.map( (move, index) =>{
                        return (
                            <li key={`move-${index}-${move.from}-${move.to}`}>{`${move.from}`}&rarr;{`${move.to}`}</li>
                        );
                    })}
                </ul>
        </div>
    </div>
    );

};


export default TowersOfHanoi;

