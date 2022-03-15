

const MovesPanel = ({moves, movesHistory}) =>{

    const getMovesDiv = (header, movesArray) =>{
        return (
            <div className="col-sm-4">
                <h3>{header}</h3>
                <ul>
                    {movesArray.map( (move, index) =>{
                        return (
                            <li key={`move-${index}-${move.from}-${move.to}`}>{`${move.from}`}&rarr;{`${move.to}`}</li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <div className="row">
            { getMovesDiv("Future Moves", moves)}
            { getMovesDiv("Previous Moves", movesHistory)}
        </div>
    );
};

export default MovesPanel;

