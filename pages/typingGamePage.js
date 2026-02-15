import Script from 'next/script';
import BackLink from '../comps/backLink';

const TypingGamePage = () => {
    return (
        <div className="container bg-lighter text-secondary">
            <BackLink />
            <div className="row pb-3">
                <div className="col-12 text-center">
                    <h2 className="text-primary">Typing Game</h2>
                    <p>Type the falling words to score points.</p>
                    <p>Powered by <a href="http://aharrisbooks.net/h5g/" target="_blank" rel="noopener noreferrer">SimpleGame.js</a></p>
                </div>
            </div>

            <div className="row">
                <div className="col-12 text-center">
                    <div id="typing-game-container" />
                </div>
            </div>

            <Script src="/js/game.js" strategy="beforeInteractive" />
            <Script src="/js/gameextensions.js" strategy="beforeInteractive" />
            <Script src="/js/typingGame.js" strategy="afterInteractive" />
        </div>
    );
};

export default TypingGamePage;
