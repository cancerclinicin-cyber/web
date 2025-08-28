import React, { useEffect } from 'react';
import styles from './Home.module.css';
import config from './../../../configLoader';

export default function Home() {
  useEffect(() => {
    console.log("-----------------------")
    console.log('Application Config:', config); // This should be exposed in console
  }, []);

  return (
    <>
      <h1 className={styles.home}>Home works</h1>
    </>
  );
}
