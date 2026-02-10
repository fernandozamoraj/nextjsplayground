/**
 * Calculate investment growth month by month
 * @param {number} startingAmount - Initial investment amount
 * @param {number} annualReturnPercent - Annual return percentage (e.g., 9 for 9%)
 * @param {number} monthlyContribution - Monthly contribution amount
 * @param {number} monthlyGrowthPercent - Monthly increase in contribution (e.g., 3 for 3% per month)
 * @param {number} months - Total number of months to calculate
 * @returns {Array} Array of monthly investment details
 */
export const calculateInvestmentGrowth = (
    startingAmount,
    annualReturnPercent,
    monthlyContribution,
    monthlyGrowthPercent,
    months
) => {
    const monthlyReturnRate = (annualReturnPercent / 100) / 12;
    const monthlyGrowthRate = monthlyGrowthPercent / 100;
    
    let currentBalance = startingAmount * 1.0;
    let currentMonthlyContribution = monthlyContribution * 1.0;
    let totalContributions = startingAmount;
    let totalInterest = 0;
    
    const results = [];
    
    for (let month = 1; month <= months; month++) {
        // Calculate interest earned this month
        const interestEarned = currentBalance * monthlyReturnRate;
        
        // Add interest and monthly contribution
        currentBalance = currentBalance + interestEarned + currentMonthlyContribution;
        totalContributions += currentMonthlyContribution;
        totalInterest += interestEarned;
        
        results.push({
            month: month,
            balance: currentBalance,
            interestEarned: interestEarned,
            totalInterest: totalInterest,
            totalContributions: totalContributions,
            monthlyContribution: currentMonthlyContribution
        });
        
        // Increase monthly contribution by growth rate for next month
        // onlu increase it every 12 months to make it a yearly increase instead of monthly
        if(month % 12 === 0)    
            currentMonthlyContribution = currentMonthlyContribution * (1 + monthlyGrowthRate);
    }
    
    return results;
};
