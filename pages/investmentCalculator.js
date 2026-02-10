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
                        <label htmlFor="monthlyGrowthInput" className="form-label">Monthly Growth %</label>
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
                        <label htmlFor="timeInMonthsInput" className="form-label">Time in Months</label>
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
                                    <li className="list-group-item">Final Balance: {getFormattedCurrency(calculatorState.finalBalance)}</li>
                                    <li className="list-group-item">Total Contributions: {getFormattedCurrency(calculatorState.totalContributions)}</li>
                                    <li className="list-group-item">Total Interest Earned: {getFormattedCurrency(calculatorState.totalInterest)}</li>
                                </ul>

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
