import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import BackLink from '../comps/backLink';
import styles from '../styles/LoanBubbles.module.css';

const initialFormState = {
  name: '',
  principal: '',
  payment: '',
  rate: ''
};

const LoanBubbles = () => {
  const [entries, setEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [dragOverSide, setDragOverSide] = useState(null);
  const [draggedEntryId, setDraggedEntryId] = useState(null);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const nextEntryId = useRef(1);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedEntries = window.localStorage.getItem('loan-bubbles-entries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        if (Array.isArray(parsedEntries) && parsedEntries.length > 0) {
          setEntries(parsedEntries);
          nextEntryId.current = parsedEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
        }
      }
    } catch (error) {
      console.error('Failed to load loan bubbles from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem('loan-bubbles-entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save loan bubbles to localStorage', error);
    }
  }, [entries]);

  const leftEntries = entries.filter((entry) => entry.side === 'left');
  const rightEntries = entries.filter((entry) => entry.side === 'right');

  const totalPrincipal = leftEntries.reduce((sum, entry) => sum + entry.principal, 0);
  const totalPayment = leftEntries.reduce((sum, entry) => sum + entry.payment, 0);
  const weightedAverageRate = totalPrincipal > 0
    ? leftEntries.reduce((sum, entry) => sum + (entry.principal / totalPrincipal) * entry.rate, 0)
    : 0;

  const colorForId = (id) => {
    const hues = [210, 260, 160, 20, 340, 40, 190, 280];
    const hue = hues[id % hues.length];
    return `hsl(${hue}, 65%, 55%)`;
  };

  const formatMoney = (value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const formatPercent = (value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;

  const openModal = () => {
    setFormState(initialFormState);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleFieldChange = (event) => {
    const { id, value } = event.target;
    setFormState((currentState) => ({
      ...currentState,
      [id]: value
    }));
  };

  const handleAddEntry = (event) => {
    event.preventDefault();

    const name = formState.name.trim();
    const principal = parseFloat(formState.principal);
    const payment = parseFloat(formState.payment);
    const rate = parseFloat(formState.rate);

    if (!name) {
      setFormError('Please enter a name for this entry.');
      return;
    }

    if (Number.isNaN(principal) || Number.isNaN(payment) || Number.isNaN(rate)) {
      setFormError('Please enter valid numbers for Principal, Monthly Payment, and Interest Rate.');
      return;
    }

    setEntries((currentEntries) => [
      ...currentEntries,
      {
        id: nextEntryId.current,
        name,
        principal,
        payment,
        rate,
        side: 'right'
      }
    ]);

    nextEntryId.current += 1;
    closeModal();
  };

  const handleRemoveEntry = (entryId, event) => {
    event.stopPropagation();
    setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId));
  };

  const handleExport = () => {
    const exportData = JSON.stringify(entries, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'loan-bubbles-export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImportText = (event) => {
    event.preventDefault();
    setImportError('');

    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error('Import data must be a JSON array.');
      }

      const normalizedEntries = parsed.map((entry, index) => ({
        id: Number.isInteger(entry.id) ? entry.id : nextEntryId.current + index,
        name: String(entry.name || `Entry ${index + 1}`),
        principal: Number(entry.principal),
        payment: Number(entry.payment),
        rate: Number(entry.rate),
        side: entry.side === 'left' ? 'left' : 'right'
      }));

      setEntries(normalizedEntries);
      nextEntryId.current = normalizedEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
      setImportText('');
      setShowImportModal(false);
    } catch (error) {
      setImportError(error.message || 'Unable to import data.');
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) {
          throw new Error('Import data must be a JSON array.');
        }

        const normalizedEntries = parsed.map((entry, index) => ({
          id: Number.isInteger(entry.id) ? entry.id : nextEntryId.current + index,
          name: String(entry.name || `Entry ${index + 1}`),
          principal: Number(entry.principal),
          payment: Number(entry.payment),
          rate: Number(entry.rate),
          side: entry.side === 'left' ? 'left' : 'right'
        }));

        setEntries(normalizedEntries);
        nextEntryId.current = normalizedEntries.reduce((maxId, entry) => Math.max(maxId, entry.id), 0) + 1;
        setImportError('');
        setShowImportModal(false);
      } catch (error) {
        setImportError(error.message || 'Unable to import data.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const toggleEntrySide = (entryId) => {
    setEntries((currentEntries) => currentEntries.map((entry) => {
      if (entry.id !== entryId) {
        return entry;
      }

      return {
        ...entry,
        side: entry.side === 'left' ? 'right' : 'left'
      };
    }));
  };

  const handleDrop = (side, event) => {
    event.preventDefault();
    setDragOverSide(null);

    const entryId = Number(event.dataTransfer.getData('text/plain') || draggedEntryId || 0);
    if (!entryId) {
      return;
    }

    setEntries((currentEntries) => currentEntries.map((entry) => {
      if (entry.id !== entryId) {
        return entry;
      }

      return {
        ...entry,
        side
      };
    }));
    setDraggedEntryId(null);
  };

  const handleDragStart = (entry, event) => {
    event.dataTransfer.setData('text/plain', String(entry.id));
    setDraggedEntryId(entry.id);
  };

  const handleDragOver = (side, event) => {
    event.preventDefault();
    setDragOverSide(side);
  };

  return (
    <div className="container py-4">
      <Head>
        <title>Loan Bubbles</title>
        <meta name="description" content="Drag and compare loan bubbles across two panels" />
      </Head>

      <BackLink />

      <div className="text-center mb-4">
        <h1 className="h2 mb-2">Loan Bubbles</h1>
        <p className="text-muted mb-0">
          Drag bubbles between panels to compare loan balances and payment obligations.
        </p>
      </div>

      <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
        <button type="button" className="btn btn-primary" onClick={openModal}>
          + Add Entry
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleExport}>
          Export JSON
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowImportModal(true)}>
          Import JSON
        </button>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-lg-5">
          <div
            className={`${styles.panel} ${dragOverSide === 'left' ? styles.dragover : ''}`}
            onDragOver={(event) => handleDragOver('left', event)}
            onDragLeave={() => setDragOverSide(null)}
            onDrop={(event) => handleDrop('left', event)}
          >
            <h2>Left</h2>
            <div className={styles.bubbleArea}>
              {leftEntries.length === 0 ? (
                <div className={styles.emptyMsg}>No entries. Drag bubbles here.</div>
              ) : (
                leftEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={styles.bubble}
                    style={{ background: colorForId(entry.id) }}
                    draggable
                    onDragStart={(event) => handleDragStart(entry, event)}
                    onDragEnd={() => setDraggedEntryId(null)}
                    onClick={() => toggleEntrySide(entry.id)}
                  >
                    <div className={styles.name}>{entry.name}</div>
                    <div className={styles.field}>
                      <span className={styles.label}>Principal</span>
                      <span className={styles.value}>{formatMoney(entry.principal)}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Monthly</span>
                      <span className={styles.value}>{formatMoney(entry.payment)}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Rate</span>
                      <span className={styles.value}>{formatPercent(entry.rate)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      title="Remove"
                      onClick={(event) => handleRemoveEntry(entry.id, event)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className={styles.totalsRow}>
              <div className={styles.totalName}>Totals</div>
              <div className={styles.field}>
                <span className={styles.label}>Principal</span>
                <span className={styles.value}>{formatMoney(totalPrincipal)}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Monthly</span>
                <span className={styles.value}>{formatMoney(totalPayment)}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Rate</span>
                <span className={styles.value}>{formatPercent(weightedAverageRate)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div
            className={`${styles.panel} ${dragOverSide === 'right' ? styles.dragover : ''}`}
            onDragOver={(event) => handleDragOver('right', event)}
            onDragLeave={() => setDragOverSide(null)}
            onDrop={(event) => handleDrop('right', event)}
          >
            <h2>Right</h2>
            <div className={styles.bubbleArea}>
              {rightEntries.length === 0 ? (
                <div className={styles.emptyMsg}>No entries yet. Click “+ Add Entry”.</div>
              ) : (
                rightEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={styles.bubble}
                    style={{ background: colorForId(entry.id) }}
                    draggable
                    onDragStart={(event) => handleDragStart(entry, event)}
                    onDragEnd={() => setDraggedEntryId(null)}
                    onClick={() => toggleEntrySide(entry.id)}
                  >
                    <div className={styles.name}>{entry.name}</div>
                    <div className={styles.field}>
                      <span className={styles.label}>Principal</span>
                      <span className={styles.value}>{formatMoney(entry.principal)}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Monthly</span>
                      <span className={styles.value}>{formatMoney(entry.payment)}</span>
                    </div>
                    <div className={styles.field}>
                      <span className={styles.label}>Rate</span>
                      <span className={styles.value}>{formatPercent(entry.rate)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      title="Remove"
                      onClick={(event) => handleRemoveEntry(entry.id, event)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Import Loan Bubbles</h3>
            <p className="small text-muted">Paste JSON data or choose a file exported from this page.</p>
            <textarea
              className="form-control"
              rows="8"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder='[{"name":"Car Loan","principal":25000,"payment":450,"rate":5.25,"side":"right"}]'
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="form-control mt-3"
              onChange={handleImportFile}
            />

            {importError && <div className={styles.errorMessage}>{importError}</div>}

            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </button>
              <button type="button" className="btn btn-primary" onClick={(event) => handleImportText(event)}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Add New Entry</h3>
            <form onSubmit={handleAddEntry}>
              <label htmlFor="name" className={styles.modalLabel}>Name</label>
              <input
                id="name"
                type="text"
                className="form-control"
                placeholder="e.g. Car Loan"
                value={formState.name}
                onChange={handleFieldChange}
              />

              <label htmlFor="principal" className={styles.modalLabel}>Principal ($)</label>
              <input
                id="principal"
                type="number"
                className="form-control"
                placeholder="e.g. 25000"
                step="any"
                value={formState.principal}
                onChange={handleFieldChange}
              />

              <label htmlFor="payment" className={styles.modalLabel}>Monthly Payment ($)</label>
              <input
                id="payment"
                type="number"
                className="form-control"
                placeholder="e.g. 450"
                step="any"
                value={formState.payment}
                onChange={handleFieldChange}
              />

              <label htmlFor="rate" className={styles.modalLabel}>Interest Rate (%)</label>
              <input
                id="rate"
                type="number"
                className="form-control"
                placeholder="e.g. 5.25"
                step="any"
                value={formState.rate}
                onChange={handleFieldChange}
              />

              {formError && <div className={styles.errorMessage}>{formError}</div>}

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanBubbles;
