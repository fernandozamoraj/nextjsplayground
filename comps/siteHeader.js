import React, { useEffect, useState } from 'react';
import styles from '../styles/SiteHeader.module.css';

const SiteHeader = () => {
  const [storageInfo, setStorageInfo] = useState({ usedBytes: 0, total: 5, percentage: '0' });

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

  useEffect(() => {
    calculateStorageUsage();
    const interval = setInterval(calculateStorageUsage, 1000);
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
    </div>
  );
};

export default SiteHeader;
