import styles from '../styles/Button.module.css';

const ActionButton = ({text, onClick, leftArrow, rightArrow}) =>{

    return (
        <p>
            <button
                className={styles.actionButton}
                type="button"
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