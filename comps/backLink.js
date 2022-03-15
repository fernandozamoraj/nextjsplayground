
import Link from 'next/link';

const BackLink = () =>{

    return (
        <Link href="/">
            <a>
                <h2> &larr; Back</h2>   
            </a>
        </Link>
    );
};

export default BackLink;