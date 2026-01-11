export function getPaydates(year, firstPayDate, payPeriodDays) {
    const paydates = [];
    let currentDate = new Date(firstPayDate);
    
    // Calculate paydays for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    // Go back to find first payday of or before year
    while (currentDate > yearStart) {
        currentDate.setDate(currentDate.getDate() - payPeriodDays);
    }
    
    // Move forward to first payday in year
    while (currentDate < yearStart) {
        currentDate.setDate(currentDate.getDate() + payPeriodDays);
    }
    
    // Collect all paydays in the year
    while (currentDate <= yearEnd) {
        paydates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + payPeriodDays);
    }
    
    return paydates;
}

export function getPaydatesForMonth(year, month, paydates) {
    const monthPaydates = paydates.filter(date => 
        date.getFullYear() === year && date.getMonth() === month
    );
    
    // Return array with flags for which is third
    return monthPaydates.map((date, index) => ({
        date: date,
        isThird: index === 2 && monthPaydates.length >= 3
    }));
}

export function isPayday(year, month, day, paydates) {
    for (let paydayInfo of paydates) {
        const payday = paydayInfo.date;
        if (payday.getFullYear() === year && 
            payday.getMonth() === month && 
            payday.getDate() === day) {
            return paydayInfo;
        }
    }
    return null;
}

export function generateMonthData(year, month, paydates) {
    const monthPaydates = getPaydatesForMonth(year, month, paydates);
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let dayCounter = 1;
    let nextMonthCounter = 1;
    
    // Calculate total rows needed (usually 5 or 6)
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const rows = totalCells / 7;
    
    const weeks = [];
    
    for (let row = 0; row < rows; row++) {
        const week = [];
        
        for (let col = 0; col < 7; col++) {
            const cellIndex = row * 7 + col;
            
            if (cellIndex < firstDay) {
                // Previous month days
                const day = daysInPrevMonth - firstDay + cellIndex + 1;
                week.push({ day, isOtherMonth: true });
            } else if (dayCounter <= daysInMonth) {
                // Current month days
                const paydayInfo = isPayday(year, month, dayCounter, monthPaydates);
                week.push({ 
                    day: dayCounter, 
                    isOtherMonth: false,
                    isPayday: !!paydayInfo,
                    isThirdPayday: paydayInfo ? paydayInfo.isThird : false
                });
                dayCounter++;
            } else {
                // Next month days
                week.push({ day: nextMonthCounter, isOtherMonth: true });
                nextMonthCounter++;
            }
        }
        
        weeks.push(week);
    }
    
    return weeks;
}
