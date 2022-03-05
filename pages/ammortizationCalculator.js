import { useState } from 'react';
import NumericInput from 'react-numeric-input';
import Link from 'next/link'

const AmmortizationCalculator = () =>{

    const [amount, setAmount] = useState(1000);
    const [interestRate, setInterestRate] = useState(5.5);
    const [termLength, setTermLength] = useState(36);
    const [payment, setPayment] = useState(0);
    const [ammortizationTable, setAmmortizationTable] = useState([]);

    const handleCalculate = () => {
         console.log(`amount: ${amount}`);
         console.log(`interest rate: ${interestRate}`);
         console.log(`term length: ${termLength}`);
         setPayment(calculatePayment(amount, interestRate, termLength));
         createAmmortizationTable(amount, interestRate, termLength);         
    };

    const calculatePayment = () =>{
        const p = amount * 1.0;
        const rate = interestRate * 1.0;
        const n = termLength * 1;
        const r = (rate * .01)/12.0;
        const A = p * (r * Math.pow(1+r, n))/(Math.pow(1+r, n)-1);
        const monthlyPayment = A;

        return monthlyPayment;
    }

    const createAmmortizationTable = () =>{
        let principal = amount * 1;       //multiply times 1 to force to numeric value --- otherwise it will be text
        const termInMonths = termLength * 1;
        const monthlyInterest = interestRate/(12*100);
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

        setAmmortizationTable(payments);

    }

    const getFormattedCurrency = (currency) =>{
        return `$ ${currency.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`;
    }
 
 return (
        <div>

            <Link href="/">
                <a>
                    Back Home
                </a>
            </Link>

            <div className="mb-3">
            <label htmlFor="amountInput" className="form-label">Loan Amount</label>
            <NumericInput 
                style={false} 
                type="text" 
                className="form-control" 
                id="amountInput" 
                placeholder="1000" 
                value={amount}
                onChange={ value => setAmount(value)}
                />
            </div>
            <div className="mb-3">
            <label htmlFor="interestRateInput" className="form-label">Interest Rate</label>
            <NumericInput 
               style={false} 
               step={0.01} 
               precision={2} 
               value={interestRate} 
               onChange={ value => setInterestRate(value)}
               type="text" 
               className="form-control" 
               id="InterestRateInput" 
               placeholder="3.5" />
            </div>
            <div className="mb-3">
            <label htmlFor="termLengthInMonthsInput" className="form-label">Term Length (in months)</label>
            <NumericInput 
               style={false}  
               step={1} 
               precision={0} 
               value={termLength} 
               onChange={ value => setTermLength(value)}
               type="text" 
               className="form-control" 
               id="termLengthInMonthsInput" 
               placeholder="120" />
            </div>
            <div className="mb-3">
                <button
                    className="btn btn-primary"
                    type="button"
                    id="ammortizationCalculate"
                    aria-expanded="false"
                    onClick={ () => handleCalculate()}
                > Compute </button>
            </div>
            <div>
                Payment: {`$ ${payment.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`}
            </div>

            {
                ammortizationTable.length > 0 && 
                (<table class="table">
                    <thead class="thead-dark">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Principal</th>
                        <th scope="col">Accumulated Interest</th>
                        <th scope="col">Accumulated Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ammortizationTable.map( (x, i) =>(
                        <tr key={`ammort-row-${i}`}>
                            <th>{`${i+1}`}</th>
                            <td>{`${getFormattedCurrency(x.principal)}`}</td>
                            <td>{`${getFormattedCurrency(x.totalInterest)}`}</td>  
                            <td>{`${getFormattedCurrency(x.total)}`}</td>              
                        </tr>
                    ))}
                    </tbody>
                </table>)
            }
        </div>

    );
};

export default AmmortizationCalculator;