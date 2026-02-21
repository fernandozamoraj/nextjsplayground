
import Link from 'next/link';
import styles from '../styles/Button.module.css';

const BackLink = ({className}) =>{

    return (
        <Link href="/">
            <a className={`${styles.backLink} ${className || ''}`}>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
    );
};

export default BackLink;