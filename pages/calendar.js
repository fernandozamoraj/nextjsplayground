import { useState } from 'react';
import Head from 'next/head';
import { getPaydates, generateMonthData } from '../utils/services/calendarFunctions';
import BackLink from '../comps/backLink';
import ActionButton from '../comps/actionButton';
import styles from '../styles/Calendar.module.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
    //get current year as variable and set that to the current year
    const currentYearValue = new Date().getFullYear();
    //get first friday of the year as default payday
    const firstFriday = new Date(currentYearValue, 0, 1);
    while (firstFriday.getDay() !== 5) {
        firstFriday.setDate(firstFriday.getDate() + 1);
    }
    const [currentYear, setCurrentYear] = useState(currentYearValue);
    const [payConfig, setPayConfig] = useState({
        month: 0,  // January (0-indexed)
        day: firstFriday.getDate(), //set to first friday
        year: currentYearValue,
        payPeriodDays: 14
    });

    const handleYearChange = (delta) => {
        setCurrentYear(currentYear + delta);
    };

    const handlePayConfigChange = (field, value) => {
        setPayConfig({...payConfig, [field]: parseInt(value)});
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const firstPayDate = new Date(payConfig.year, payConfig.month, payConfig.day);

    const paydates = getPaydates(currentYear, firstPayDate, payConfig.payPeriodDays);

    const renderMonth = (monthIndex) => {
        const weeks = generateMonthData(currentYear, monthIndex, paydates);

        return (
            <div key={`month-${monthIndex}`} className={styles.monthContainer}>
                <div className={styles.monthName}>{MONTHS[monthIndex]}</div>
                <table className={styles.calendarTable}>
                    <thead>
                        <tr>
                            {DAYS_OF_WEEK.map(day => (
                                <th key={day}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((week, weekIndex) => (
                            <tr key={`week-${weekIndex}`}>
                                {week.map((dayData, dayIndex) => {
                                    let className = dayData.isOtherMonth 
                                        ? styles.otherMonth 
                                        : styles.currentMonth;
                                    
                                    if (dayData.isThirdPayday) {
                                        className = styles.paydayThird;
                                    } else if (dayData.isPayday) {
                                        className = styles.payday;
                                    }

                                    return (
                                        <td key={`day-${dayIndex}`} className={className}>
                                            {dayData.day}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container bg-lighter text-secondary">
            <Head>
                <title>Payday Calendar {currentYear}</title>
                <meta name="description" content="Biweekly payday calendar tracker" />
            </Head>

            <BackLink />

            <div className={styles.printHeader}>Payday Calendar {currentYear}</div>

            <div className="row pb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Payday Configuration</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <label className="form-label">First Payday Month</label>
                                    <select 
                                        className="form-select" 
                                        value={payConfig.month}
                                        onChange={(e) => handlePayConfigChange('month', e.target.value)}
                                    >
                                        {MONTHS.map((month, index) => (
                                            <option key={index} value={index}>{month}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Day</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        min="1" 
                                        max="31"
                                        value={payConfig.day}
                                        onChange={(e) => handlePayConfigChange('day', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Year</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        min="2020" 
                                        max="2100"
                                        value={payConfig.year}
                                        onChange={(e) => handlePayConfigChange('year', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Pay Period (Days)</label>
                                    <select 
                                        className="form-select" 
                                        value={payConfig.payPeriodDays}
                                        onChange={(e) => handlePayConfigChange('payPeriodDays', e.target.value)}
                                    >
                                        <option value="7">Weekly (7 days)</option>
                                        <option value="14">Bi-weekly (14 days)</option>
                                        <option value="15">Semi-monthly (15 days)</option>
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <div className="alert alert-info mb-0 p-2 small">
                                        First Pay: {MONTHS[payConfig.month]} {payConfig.day}, {payConfig.year}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.header}>
                <div className={styles.yearNav}>
                    <ActionButton 
                        text="Previous Year" 
                        leftArrow={true}
                        onClick={() => handleYearChange(-1)} 
                    />
                    <span className={styles.yearTitle}>{currentYear}</span>
                    <ActionButton 
                        text="Next Year" 
                        rightArrow={true}
                        onClick={() => handleYearChange(1)} 
                    />
                    <ActionButton
                        text="Print"
                        onClick={handlePrint}
                    />
                </div>
            </div>

            <div className={styles.calendarGrid}>
                {MONTHS.map((_, index) => renderMonth(index))}
            </div>
        </div>
    );
};

export default Calendar;