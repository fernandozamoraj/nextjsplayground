
import ActionButton from '../actionButton';

const ButtonsPanel = ({onHandleSolution, onHandlePreviousMove, onHandleNextMove}) =>{

    return (
        <div className="col-sm-8 jumbotron text-center">
            <h2 className="text-primary">Towers of Hanoi</h2>
            <p>Solve the towers</p>
            <p>An example of undo and redo</p>
            
            <p>
                <ActionButton onClick={onHandleSolution} text="Solve" /> 
            </p>
        
            <div className="row">
                <div className="col-sm-6">
                    <ActionButton onClick={onHandlePreviousMove} text="Previous" leftArrow={true} />
                </div>
                <div className="col-sm-6">
                    <ActionButton onClick={onHandleNextMove} text="Next" rightArrow={true} />
                </div>
            </div>
        </div>
    );
};

export default ButtonsPanel;