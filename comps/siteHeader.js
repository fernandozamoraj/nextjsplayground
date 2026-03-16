import React, { useEffect, useState } from 'react';
import styles from '../styles/SiteHeader.module.css';
import dailyQuotes from '../utils/data/dailyQuotes.json';

const SiteHeader = () => {
  const [storageInfo, setStorageInfo] = useState({ usedBytes: 0, total: 5, percentage: '0' });
  const [currentTime, setCurrentTime] = useState(new Date());

  const calculateStorageUsage = () => {
    let totalUsed = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalUsed += localStorage[key].length + key.length;
      }
    }
    const totalAllowedMB = 5;
    const percentage = Math.min(100, ((totalUsed / (1024 * 1024)) / totalAllowedMB * 100).toFixed(1));
    setStorageInfo({ usedBytes: totalUsed, total: totalAllowedMB, percentage });
  };

  const formatStorageUsed = (bytes) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = (bytes / 1024).toFixed(2);
      return `${kb} KB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const dayOfYear = getDayOfYear(currentTime);
  const quoteIndex = (dayOfYear - 1) % dailyQuotes.length;
  const todaysQuote = dailyQuotes[quoteIndex];
  const formattedDateTime = `${currentTime.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} • ${currentTime.toLocaleTimeString()}`;

  useEffect(() => {
    calculateStorageUsage();
    const interval = setInterval(() => {
      calculateStorageUsage();
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.title}>Next.js Playground</div>
        <div className={styles.storageDisplay}>
          Storage: {formatStorageUsed(storageInfo.usedBytes)} / {storageInfo.total} MB ({storageInfo.percentage}%)
        </div>
      </div>
      <div className={styles.quoteBanner}>
        <span className={styles.timeDisplay}>{formattedDateTime}</span>
        <span className={styles.quoteText}>
          Day {todaysQuote.day}: “{todaysQuote.quote}” — {todaysQuote.author}
        </span>
      </div>
    </div>
  );
};

export default SiteHeader;
