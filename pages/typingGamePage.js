import { useEffect } from 'react';
import BackLink from '../comps/backLink';

const TypingGamePage = () => {
    useEffect(() => {
        let isMounted = true;

        const loadScript = (src, key) => {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[data-typing-game="${key}"]`);
                if (existing) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.dataset.typingGame = key;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.body.appendChild(script);
            });
        };

        const startGame = async () => {
            try {
                await loadScript('/js/game.js', 'game');
                await loadScript('/js/gameextensions.js', 'extensions');
                await loadScript('/js/typingGame.js', 'typing');

                if (!isMounted) {
                    return;
                }

                if (window.game && typeof window.game.stop === 'function') {
                    window.game.stop();
                }

                if (typeof window.init === 'function') {
                    window.init();
                }
            } catch (error) {
                console.error(error.message);
            }
        };

        if (typeof window !== 'undefined') {
            startGame();
        }

        return () => {
            isMounted = false;
            if (window.game && typeof window.game.stop === 'function') {
                window.game.stop();
            }
            const container = document.getElementById('typing-game-container');
            if (container) {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
        };
    }, []);

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

        </div>
    );
};

export default TypingGamePage;
