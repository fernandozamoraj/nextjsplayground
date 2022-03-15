
const ActionButton = ({text, onClick, leftArrow, rightArrow}) =>{

    return (
        <p>
            <button
                
                style={{width:'100%', padding: 20, margin: 0 }}
                className="btn btn-info text-white"
                type="button"
                id="btn-sudoku-previous"
                aria-expanded="false"
                onClick={ (event) => onClick(event) }
            > 
                
                { leftArrow  && <h2> &larr; {text}</h2> }
                { rightArrow && <h2> &rarr; {text}</h2> }
                { !leftArrow && !rightArrow && <h2>{text}</h2>} 
            </button>   
        </p>
    );
};

export default ActionButton;