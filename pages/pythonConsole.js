import { useCallback, useEffect, useRef, useState } from 'react';
import BackLink from '../comps/backLink';
import ActionButton from '../comps/actionButton';

const CODE_SAMPLES = {
    intro: {
        label: 'Intro / Print & Variables',
        code: `name = "Ada"\nage = 36\nprint("Hello", name)\nprint("Age:", age)`
    },
    functions: {
        label: 'Functions',
        code: `def greet(person):\n    return f"Hello, {person}!"\n\nmessage = greet("Linus")\nprint(message)`
    },
    loops: {
        label: 'For Loops',
        code: `total = 0\nfor i in range(1, 6):\n    total += i\n    print("i:", i, "total:", total)`
    },
    lists: {
        label: 'Lists (Arrays)',
        code: `numbers = [2, 4, 6, 8]\nprint("length:", len(numbers))\nprint("first:", numbers[0])\nprint("last:", numbers[-1])\nprint("sum:", sum(numbers))`
    },
    dictionaries: {
        label: 'Dictionaries',
        code: `user = {"name": "Grace", "role": "Engineer"}\nprint(user["name"], "-", user["role"])\nuser["role"] = "Scientist"\nprint(user)`
    },
    inputSamples: {
        label: 'Input (Sample Values)',
        code: `# Pyodide doesn't support interactive stdin,\n# so we simulate input values with variables.\n\nraw_age = "21"\nraw_score = "88.5"\n\nage = int(raw_age)\nscore = float(raw_score)\nprint("age:", age)\nprint("score:", score)`
    },
    conditionals: {
        label: 'Conditionals',
        code: `temperature = 72\nif temperature >= 80:\n    print("Hot")\nelif temperature >= 60:\n    print("Warm")\nelse:\n    print("Cool")`
    },
    fileReadMock: {
        label: 'File Read (Mocked)',
        code: `# Simulate reading a file with an in-memory string\nmock_file = """\nname,score\nAda,95\nLinus,88\nGrace,92\n"""\n\nlines = mock_file.strip().split("\\n")\nheader = lines[0].split(",")\nrows = [line.split(",") for line in lines[1:]]\n\nprint("header:", header)\nprint("rows:", rows)\n\n# Convert to list of dicts\nrecords = []\nfor row in rows:\n    records.append({header[0]: row[0], header[1]: int(row[1])})\n\nprint("records:", records)`
    }
};

const DEFAULT_CODE = `${CODE_SAMPLES.intro.code}`;

const PythonConsole = () => {
    const pyodideRef = useRef(null);
    const [consoleState, setConsoleState] = useState({
        code: DEFAULT_CODE,
        output: '',
        error: '',
        isReady: false,
        isRunning: false,
        selectedSample: 'intro'
    });

    const normalizeOutput = useCallback((text) => {
        if (!text) {
            return '';
        }
        return text.endsWith('\n') ? text : `${text}\n`;
    }, []);

    const appendOutput = useCallback((text) => {
        setConsoleState((prev) => ({
            ...prev,
            output: `${prev.output}${normalizeOutput(text)}`
        }));
    }, [normalizeOutput]);

    const appendError = useCallback((text) => {
        setConsoleState((prev) => ({
            ...prev,
            error: `${prev.error}${normalizeOutput(text)}`
        }));
    }, [normalizeOutput]);

    useEffect(() => {
        let isMounted = true;

        const loadPyodideScript = () => {
            return new Promise((resolve, reject) => {
                if (window.loadPyodide) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Pyodide'));
                document.body.appendChild(script);
            });
        };

        const initializePyodide = async () => {
            try {
                await loadPyodideScript();
                const pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
                });

                pyodide.setStdout({
                    batched: (text) => appendOutput(text)
                });
                pyodide.setStderr({
                    batched: (text) => appendError(text)
                });

                if (isMounted) {
                    pyodideRef.current = pyodide;
                    setConsoleState((prev) => ({
                        ...prev,
                        isReady: true
                    }));
                }
            } catch (err) {
                if (isMounted) {
                    setConsoleState((prev) => ({
                        ...prev,
                        error: `${prev.error}${err.message}\n`
                    }));
                }
            }
        };

        if (typeof window !== 'undefined') {
            initializePyodide();
        }

        return () => {
            isMounted = false;
        };
    }, [appendError, appendOutput]);

    const handleRun = async (codeOverride) => {
        if (!pyodideRef.current || consoleState.isRunning) {
            return;
        }

        setConsoleState((prev) => ({
            ...prev,
            error: '',
            isRunning: true
        }));

        try {
            const codeToRun = typeof codeOverride === 'string' ? codeOverride : consoleState.code;
            const result = await pyodideRef.current.runPythonAsync(codeToRun);
            if (result !== undefined && result !== null) {
                appendOutput(`${result}\n`);
            }
        } catch (err) {
            appendError(`${err.message}\n`);
        } finally {
            setConsoleState((prev) => ({
                ...prev,
                isRunning: false
            }));
        }
    };

    const handleClear = () => {
        setConsoleState((prev) => ({
            ...prev,
            output: '',
            error: ''
        }));
    };

    const handleCodeChange = (event) => {
        setConsoleState((prev) => ({
            ...prev,
            code: event.target.value
        }));
    };

    const handleSampleChange = (event) => {
        const sampleKey = event.target.value;
        const sample = CODE_SAMPLES[sampleKey];

        setConsoleState((prev) => ({
            ...prev,
            selectedSample: sampleKey,
            code: sample ? sample.code : prev.code
        }));
    };

    return (
        <div
            className="container bg-lighter text-secondary"
            style={{ paddingBottom: '2rem' }}
        >
            <BackLink />
            <div className="row pb-4">
                <div className="col-12 text-center">
                    <h2 className="text-primary">Python Console (Browser)</h2>
                    <p>Run simple Python code client-side using Pyodide.</p>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <label htmlFor="sampleSelect" className="form-label">Starter Samples</label>
                    <select
                        id="sampleSelect"
                        className="form-select mb-3"
                        value={consoleState.selectedSample}
                        onChange={handleSampleChange}
                        disabled={!consoleState.isReady || consoleState.isRunning}
                    >
                        {Object.entries(CODE_SAMPLES).map(([key, sample]) => (
                            <option key={key} value={key}>{sample.label}</option>
                        ))}
                    </select>

                    <label htmlFor="pythonCode" className="form-label">Python Code</label>
                    <textarea
                        id="pythonCode"
                        className="form-control"
                        rows={6}
                        value={consoleState.code}
                        onChange={handleCodeChange}
                        disabled={!consoleState.isReady || consoleState.isRunning}
                        style={{
                            backgroundColor: '#0f172a',
                            color: '#e2e8f0',
                            borderColor: '#334155',
                            fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                            maxHeight: '30vh',
                            overflow: 'auto'
                        }}
                    />
                </div>
            </div>

            <div className="row mt-3">
                <div className="col-sm-6">
                    <ActionButton
                        onClick={() => handleRun()}
                        text={consoleState.isRunning ? 'Running...' : consoleState.isReady ? 'Run Code' : 'Loading Python...'}
                    />
                </div>
                <div className="col-sm-6">
                    <ActionButton onClick={handleClear} text="Clear Output" />
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-12">
                    <label className="form-label">Console Output</label>
                    <pre
                        className="p-3 border"
                        style={{
                            minHeight: '100px',
                            maxHeight: '40vh',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#0b1120',
                            color: '#e2e8f0',
                            borderColor: '#334155'
                        }}
                    >
                        {consoleState.output}
                    </pre>
                    {consoleState.error && (
                        <div
                            className="alert"
                            role="alert"
                            style={{
                                backgroundColor: '#0b0b0b',
                                borderColor: '#7f1d1d',
                                color: '#f87171',
                                maxHeight: '20vh',
                                overflow: 'auto'
                            }}
                        >
                            <strong>Error:</strong>
                            <pre
                                className="mb-0"
                                style={{ whiteSpace: 'pre-wrap', color: '#f87171' }}
                            >
                                {consoleState.error}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PythonConsole;
