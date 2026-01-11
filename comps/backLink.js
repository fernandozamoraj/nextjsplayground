
import Link from 'next/link';
import styles from '../styles/Button.module.css';

const BackLink = () =>{

    return (
        <Link href="/">
            <a className={styles.backLink}>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
    );
};

export default BackLink;