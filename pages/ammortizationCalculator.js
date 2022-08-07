import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import ActionButton from '../comps/actionButton';
import BackLink from '../comps/backLink';

const AmmortizationCalculator = () =>{

    const [calculatorState, setCalculatorState] = useState(
        {
            amount: 1000,
            interestRate: 5.5,
            termLength: 36,
            payment: 0,
            ammortizationTable: [],
            totalInterest: 0,
            totalOverall: 0
        }
    );


    const handleCalculate = () => {
         let paymentAmount = calculatePayment();
         //setPayment(paymentAmount);
         let ammortizationInfo = createAmmortizationTable();  

         setCalculatorState(
             {
                ...calculatorState, 
                payment: paymentAmount, 
                totalOverall: ammortizationInfo.totalOverall, 
                totalInterest: ammortizationInfo.totalInterest, 
                ammortizationTable: ammortizationInfo.payments
            });

    };

    const calculatePayment = () =>{
        const p = calculatorState.amount * 1.0;
        const rate = calculatorState.interestRate * 1.0;
        const n = calculatorState.termLength * 1;
        const r = (rate * .01)/12.0;
        const A = p * (r * Math.pow(1+r, n))/(Math.pow(1+r, n)-1);
        const monthlyPayment = A;

        return monthlyPayment;
    }

    const createAmmortizationTable = () =>{
        let principal = calculatorState.amount * 1;       //multiply times 1 to force to numeric value --- otherwise it will be text
        const termInMonths = calculatorState.termLength * 1;
        const monthlyInterest = calculatorState.interestRate/(12*100);
        const monthlyPayment = calculatePayment();
        let totalInterest = 0.0;
        let payments = [];
        let total = 0;
        
        for(let i = 1; i <= termInMonths; i++) 
        {
            
            var currentInterest = principal * monthlyInterest;
            principal = ((principal + currentInterest) - monthlyPayment);
            totalInterest += currentInterest;
            total = total +monthlyPayment;
            
            if(principal < 0)
                principal = 0;

            payments = [...payments, 
                {principal: principal + currentInterest + monthlyPayment,
                 totalInterest: totalInterest,
                 total: total}];
            
            if(principal <= 0)
                break;
        }

        return { payments: payments, totalInterest: totalInterest, totalOverall: total};

    };


    const getFormattedCurrency = (currency) =>{
        return `$ ${currency.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    };
 
 return (
        <div>
            <div className="container">
                <BackLink/>
                <div className="row gx-5 form-group  mt-1">
                    <div className="col-3">
                        <label htmlFor="amountInput" className="form-label">Loan Amount</label>
                    </div>
                    <div className="col-6">
                        <NumericInput 
                            style={false} 
                            type="text" 
                            className="form-control" 
                            id="amountInput" 
                            placeholder="1000" 
                            value={calculatorState.amount}
                            onChange={ value => setCalculatorState({...calculatorState, amount: value})}
                            />
                    </div>
                </div>
                <div className="row gx-5 form-group  mt-1">
                    <div className="col-3">
                        <label htmlFor="interestRateInput" className="form-label">Interest Rate</label>
                    </div>
                    <div className="col-6 text-end">
                        <NumericInput 
                        style={false} 
                        step={0.01} 
                        precision={2} 
                        value={calculatorState.interestRate} 
                        onChange={ value => setCalculatorState({...calculatorState, interestRate: value})}
                        type="text" 
                        className="form-control" 
                        id="InterestRateInput" 
                        placeholder="3.5" />
                    </div>
                </div>
                <div className="row gx-5 form-group  mt-1">
                    <div className="col-3">
                        <label htmlFor="termLengthInMonthsInput" className="form-label">Term Length</label>
                    </div>
                    <div className="col-6 text-end">
                        <NumericInput 
                        style={false}  
                        step={1} 
                        precision={0} 
                        value={calculatorState.termLength} 
                        onChange={ value => setCalculatorState({...calculatorState, termLength: value})}
                        type="text" 
                        className="form-control" 
                        id="termLengthInMonthsInput" 
                        placeholder="120" />

                    </div>
                </div>    
                <div className="row mt-2">
                    <div className="col-sm-9 col-offset-1">
                        <ActionButton onClick={()=>handleCalculate()} text="Compute"/>
                    </div>
                </div>
                
            {
                calculatorState.ammortizationTable.length > 0 && 
                (
                    <div className="row mt-2">
                        <div className="col-sm-8 col-offset-1">
                            <h2>Summary</h2>
                                <ul className="list-group">
                                    <li className="list-group-item">Payment: {`${getFormattedCurrency(calculatorState.payment)}`}</li>
                                    <li className="list-group-item">Total Inerest : {`${getFormattedCurrency(calculatorState.totalInterest)}`}</li>
                                    <li className="list-group-item">Total: {`${getFormattedCurrency(calculatorState.totalOverall)}`}   </li>
                                </ul>
                            <h2>Ammortization Table</h2>  
                            <table className="table table-striped table-sm">
                                <thead className="thead-dark">
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Principal</th>
                                    <th scope="col">Accumulated Interest</th>
                                    <th scope="col">Accumulated Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {calculatorState.ammortizationTable.map( (x, i) =>(
                                        <tr key={`ammort-row-${i}`}>
                                            <th>{`${i+1}`}</th>
                                            <td>{`${getFormattedCurrency(x.principal)}`}</td>
                                            <td>{`${getFormattedCurrency(x.totalInterest)}`}</td>  
                                            <td>{`${getFormattedCurrency(x.total)}`}</td>              
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

export default AmmortizationCalculator;