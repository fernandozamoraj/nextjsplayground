import styles from '../styles/Button.module.css';

const ActionButton = ({text, onClick, leftArrow, rightArrow, compact, width}) =>{
    const TextTag = compact ? 'span' : 'h2';
    const textStyle = compact ? { fontSize: '1rem', fontWeight: 600 } : undefined;
    const buttonStyle = compact || width ? {
        width: width || '140px',
        padding: compact ? '8px 12px' : undefined
    } : undefined;

    return (
        <p>
            <button
                className={styles.actionButton}
                type="button"
                onClick={ (event) => onClick(event) }
                style={buttonStyle}
            > 
                { leftArrow  && <TextTag style={textStyle}> &larr; {text}</TextTag> }
                { rightArrow && <TextTag style={textStyle}> &rarr; {text}</TextTag> }
                { !leftArrow && !rightArrow && <TextTag style={textStyle}>{text}</TextTag>} 
            </button>   
        </p>
    );
};

export default ActionButton;