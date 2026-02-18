import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import ActionButton from '../comps/actionButton';
import BackLink from '../comps/backLink';
import { calculateInvestmentGrowth } from '../utils/services/investmentCalculatorFunctions';

const InvestmentCalculator = () => {

    const [calculatorState, setCalculatorState] = useState({
        startingAmount: 10000,
        annualReturn: 9,
        monthlyContribution: 200,
        monthlyGrowth: 3,
        timeInMonths: 120,
        results: [],
        finalBalance: 0,
        totalInterest: 0,
        totalContributions: 0
    });

    const handleCalculate = () => {
        const results = calculateInvestmentGrowth(
            calculatorState.startingAmount,
            calculatorState.annualReturn,
            calculatorState.monthlyContribution,
            calculatorState.monthlyGrowth,
            calculatorState.timeInMonths
        );

        const lastResult = results[results.length - 1];

        setCalculatorState({
            ...calculatorState,
            results: results,
            finalBalance: lastResult.balance,
            totalInterest: lastResult.totalInterest,
            totalContributions: lastResult.totalContributions
        });
    };

    const getFormattedCurrency = (currency) => {
        return `$ ${currency.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    };

    const getPlainCurrency = (currency) => {
        if (!Number.isFinite(currency)) {
            return '$ 0.00';
        }
        return `$ ${currency.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    };

    const padLeft = (value, width) => {
        const text = String(value);
        if (text.length >= width) {
            return text;
        }
        return `${' '.repeat(width - text.length)}${text}`;
    };

    const padRight = (value, width) => {
        const text = String(value);
        if (text.length >= width) {
            return text;
        }
        return `${text}${' '.repeat(width - text.length)}`;
    };

    const buildInvestmentText = () => {
        const startingAmount = calculatorState.startingAmount * 1.0;
        const annualReturn = calculatorState.annualReturn * 1.0;
        const monthlyContribution = calculatorState.monthlyContribution * 1.0;
        const monthlyGrowth = calculatorState.monthlyGrowth * 1.0;
        const timeInMonths = calculatorState.timeInMonths * 1;

        const header = [
            padRight('Month', 6),
            padRight('Balance', 16),
            padRight('Interest Earned', 18),
            padRight('Monthly Contribution', 22)
        ].join(' ');

        const lines = [
            'INVESTMENT SUMMARY',
            `Starting Amount: ${getPlainCurrency(startingAmount)}`,
            `Annual Return: ${annualReturn.toFixed(2)}%`,
            `Monthly Contribution: ${getPlainCurrency(monthlyContribution)}`,
            `Annual Monthly Increase: ${monthlyGrowth.toFixed(2)}%`,
            `Investment Period (months): ${timeInMonths}`,
            `Future Value: ${getPlainCurrency(calculatorState.finalBalance)}`,
            `Total Contributions: ${getPlainCurrency(calculatorState.totalContributions)}`,
            `Total Interest Earned: ${getPlainCurrency(calculatorState.totalInterest)}`,
            '',
            'MONTH-BY-MONTH BREAKDOWN',
            header,
            '-'.repeat(header.length)
        ];

        calculatorState.results.forEach((result) => {
            const line = [
                padLeft(result.month, 6),
                padLeft(getPlainCurrency(result.balance), 16),
                padLeft(getPlainCurrency(result.interestEarned), 18),
                padLeft(getPlainCurrency(result.monthlyContribution), 22)
            ].join(' ');
            lines.push(line);
        });

        return lines.join('\n');
    };

    const handleDownloadText = () => {
        const content = buildInvestmentText();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `investment-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="container">
                <BackLink />
                <h1 className="mt-3">Investment Growth Calculator</h1>
                
                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="startingAmountInput" className="form-label">Starting Amount</label>
                    </div>
                    <div className="col-6">
                        <NumericInput
                            style={false}
                            type="text"
                            className="form-control"
                            id="startingAmountInput"
                            placeholder="10000"
                            value={calculatorState.startingAmount}
                            onChange={value => setCalculatorState({ ...calculatorState, startingAmount: value })}
                        />
                    </div>
                </div>

                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="annualReturnInput" className="form-label">Annual Return %</label>
                    </div>
                    <div className="col-6">
                        <input
                            type="range"
                            className="form-range"
                            id="annualReturnInput"
                            min="0"
                            max="36"
                            step="0.5"
                            value={calculatorState.annualReturn}
                            onChange={e => setCalculatorState({ ...calculatorState, annualReturn: parseFloat(e.target.value) })}
                        />
                        <div className="text-center mt-1">
                            <strong>{calculatorState.annualReturn}%</strong>
                        </div>
                    </div>
                </div>

                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="monthlyContributionInput" className="form-label">Monthly Contribution</label>
                    </div>
                    <div className="col-6">
                        <NumericInput
                            style={false}
                            type="text"
                            className="form-control"
                            id="monthlyContributionInput"
                            placeholder="200"
                            value={calculatorState.monthlyContribution}
                            onChange={value => setCalculatorState({ ...calculatorState, monthlyContribution: value })}
                        />
                    </div>
                </div>

                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="monthlyGrowthInput" className="form-label">Annual Monthly Increase %</label>
                    </div>
                    <div className="col-6">
                        <NumericInput
                            style={false}
                            step={0.1}
                            precision={2}
                            value={calculatorState.monthlyGrowth}
                            onChange={value => setCalculatorState({ ...calculatorState, monthlyGrowth: value })}
                            type="text"
                            className="form-control"
                            id="monthlyGrowthInput"
                            placeholder="3"
                        />
                    </div>
                </div>

                <div className="row gx-5 form-group mt-3">
                    <div className="col-3">
                        <label htmlFor="timeInMonthsInput" className="form-label">Investment Period (Months)</label>
                    </div>
                    <div className="col-6">
                        <NumericInput
                            style={false}
                            step={1}
                            precision={0}
                            value={calculatorState.timeInMonths}
                            onChange={value => setCalculatorState({ ...calculatorState, timeInMonths: value })}
                            type="text"
                            className="form-control"
                            id="timeInMonthsInput"
                            placeholder="120"
                        />
                    </div>
                </div>

                <div className="row mt-4">
                    <div className="col-sm-9 col-offset-1">
                        <ActionButton onClick={() => handleCalculate()} text="Calculate" />
                    </div>
                </div>

                {
                    calculatorState.results.length > 0 && (
                        <div className="row mt-4">
                            <div className="col-sm-10 col-offset-1">
                                <h2>Summary</h2>
                                <ul className="list-group mb-4">
                                    <li className="list-group-item">Future Value: {getFormattedCurrency(calculatorState.finalBalance)}</li>
                                    <li className="list-group-item">Total Contributions: {getFormattedCurrency(calculatorState.totalContributions)}</li>
                                    <li className="list-group-item">Total Interest Earned: {getFormattedCurrency(calculatorState.totalInterest)}</li>
                                </ul>
                                <div className="mb-3">
                                    <ActionButton onClick={handleDownloadText} text="Download TXT" compact />
                                </div>

                                <h2>Month-by-Month Breakdown</h2>
                                <table className="table table-striped table-sm">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th scope="col">Month</th>
                                            <th scope="col">Balance</th>
                                            <th scope="col">Interest Earned</th>
                                            <th scope="col">Monthly Contribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculatorState.results.map((result, i) => (
                                            <tr key={`investment-row-${i}`}>
                                                <th>{result.month}</th>
                                                <td>{getFormattedCurrency(result.balance)}</td>
                                                <td>{getFormattedCurrency(result.interestEarned)}</td>
                                                <td>{getFormattedCurrency(result.monthlyContribution)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default InvestmentCalculator;
