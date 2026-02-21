import React, { useEffect, useMemo, useState } from 'react';
import BackLink from '../comps/backLink';
import styles from '../styles/TodoApp.module.css';

const mockTodos = [
  {
    id: 1,
    description: 'Complete project proposal',
    notes: 'Finalize requirements and send to stakeholders',
    dateCreated: '2026-02-15',
    dueBy: '2026-02-22',
    status: 'not-done'
  },
  {
    id: 2,
    description: 'Review client feedback',
    notes: 'Incorporate changes into design',
    dateCreated: '2026-02-14',
    dueBy: '2026-02-20',
    status: 'done'
  },
  {
    id: 3,
    description: 'Update database schema',
    notes: 'Add new fields for user preferences',
    dateCreated: '2026-02-13',
    dueBy: '2026-02-19',
    status: 'blocked'
  },
  {
    id: 4,
    description: 'Prepare presentation slides',
    notes: 'Include quarterly metrics and trends',
    dateCreated: '2026-02-12',
    dueBy: '2026-02-25',
    status: 'in-progress'
  },
  {
    id: 5,
    description: 'Fix login authentication bug',
    notes: 'Session timeout not working correctly',
    dateCreated: '2026-02-11',
    dueBy: '2026-02-18',
    status: 'not-done'
  },
  {
    id: 6,
    description: 'Deploy to production',
    notes: 'Run full test suite before deployment',
    dateCreated: '2026-02-10',
    dueBy: '2026-02-21',
    status: 'done'
  },
  {
    id: 7,
    description: 'Schedule team meeting',
    notes: 'Discuss roadmap and sprint planning',
    dateCreated: '2026-02-09',
    dueBy: '2026-02-23',
    status: 'done'
  },
  {
    id: 8,
    description: 'Document API endpoints',
    notes: 'Create swagger documentation',
    dateCreated: '2026-02-08',
    dueBy: '2026-02-24',
    status: 'blocked'
  },
  {
    id: 9,
    description: 'Optimize image loading',
    notes: 'Improve page performance metrics',
    dateCreated: '2026-02-07',
    dueBy: '2026-02-26',
    status: 'not-done'
  },
  {
    id: 10,
    description: 'Code review pull requests',
    notes: 'Review team members contributions',
    dateCreated: '2026-02-06',
    dueBy: '2026-02-17',
    status: 'done'
  },
  {
    id: 11,
    description: 'Set up monitoring alerts',
    notes: 'Configure CloudWatch for production',
    dateCreated: '2026-02-05',
    dueBy: '2026-02-27',
    status: 'not-done'
  },
  {
    id: 12,
    description: 'Update user documentation',
    notes: 'Add new feature guides and examples',
    dateCreated: '2026-02-04',
    dueBy: '2026-02-28',
    status: 'not-done'
  },
  {
    id: 13,
    description: 'Migrate to new server',
    notes: 'Plan and execute migration carefully',
    dateCreated: '2026-02-03',
    dueBy: '2026-03-01',
    status: 'blocked'
  },
  {
    id: 14,
    description: 'Implement caching layer',
    notes: 'Use Redis for frequently accessed data',
    dateCreated: '2026-02-02',
    dueBy: '2026-02-29',
    status: 'not-done'
  },
  {
    id: 15,
    description: 'Customer support follow-up',
    notes: 'Respond to ticket #1234',
    dateCreated: '2026-02-01',
    dueBy: '2026-02-16',
    status: 'done'
  }
];

const emptyForm = {
  description: '',
  notes: '',
  dueBy: ''
};

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(todos.length / pageSize));

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todoAppData');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        console.error('Error loading todos from localStorage:', e);
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todoAppData', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedTodos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return todos.slice(startIndex, startIndex + pageSize);
  }, [todos, currentPage]);

  const handleOpenCreate = () => {
    setDrawerMode('create');
    setActiveId(null);
    setFormData(emptyForm);
    setError('');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (todo) => {
    setDrawerMode('edit');
    setActiveId(todo.id);
    setFormData({
      description: todo.description,
      notes: todo.notes,
      dueBy: todo.dueBy
    });
    setError('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.description.trim()) return 'Description is required.';
    if (!formData.dueBy.trim()) return 'Due by date is required.';
    return '';
  };

  const handleSaveTodo = () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (drawerMode === 'create') {
      const nextId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
      const today = new Date().toISOString().split('T')[0];
      const nextTodos = [
        ...todos,
        {
          id: nextId,
          description: formData.description.trim(),
          notes: formData.notes.trim(),
          dateCreated: today,
          dueBy: formData.dueBy,
          status: 'not-done'
        }
      ];
      setTodos(nextTodos);
      setCurrentPage(Math.ceil(nextTodos.length / pageSize));
    } else {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === activeId
            ? {
                ...todo,
                description: formData.description.trim(),
                notes: formData.notes.trim(),
                dueBy: formData.dueBy
              }
            : todo
        )
      );
    }

    setDrawerOpen(false);
  };

  const handleToggleStatus = (todoId) => {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === todoId) {
          let nextStatus;
          if (todo.status === 'done') {
            nextStatus = 'blocked';
          } else if (todo.status === 'blocked') {
            nextStatus = 'not-done';
          } else {
            nextStatus = 'done';
          }
          return { ...todo, status: nextStatus };
        }
        return todo;
      })
    );
  };

  const handleDeleteTodo = (todoId) => {
    const newTodos = todos.filter((todo) => todo.id !== todoId);
    setTodos(newTodos);
    if (currentPage > Math.ceil(newTodos.length / pageSize)) {
      setCurrentPage(Math.ceil(newTodos.length / pageSize) || 1);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return '✓';
      case 'blocked':
        return '🔴';
      case 'not-done':
      default:
        return '🚫';
    }
  };

  const paginationButtons = Array.from({ length: totalPages }, (_, index) => index + 1);
  const pageStart = (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, todos.length);

  return (
    <div className={styles.page}>
      <BackLink className={styles.backLinkOverride} />
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>My Todo List</h1>
            <p className={styles.subtitle}>
              Organize your tasks with due dates, notes, and status tracking.
            </p>
          </div>
          <button className={styles.primaryButton} type="button" onClick={handleOpenCreate}>
            Add Todo Item
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.metaText}>
            Showing {pageStart}-{pageEnd} of {todos.length} items
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Description</th>
                <th>Due By</th>
                <th>Date Created</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedTodos.map((todo, index) => (
                <tr
                  key={todo.id}
                  className={styles.rowItem}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <td>
                    <span
                      className={styles.statusIcon}
                      onClick={() => handleToggleStatus(todo.id)}
                      role="button"
                      tabIndex={0}
                      title="Click to toggle status"
                    >
                      {getStatusIcon(todo.status)}
                    </span>
                  </td>
                  <td>{todo.description}</td>
                  <td>{todo.dueBy}</td>
                  <td>{todo.dateCreated}</td>
                  <td>{todo.notes}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        type="button"
                        onClick={() => handleOpenEdit(todo)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        type="button"
                        onClick={() => handleDeleteTodo(todo.id)}
                        title="Delete todo"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          {paginationButtons.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`${styles.pageButton} ${
                pageNumber === currentPage ? styles.pageButtonActive : ''
              }`}
              type="button"
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            className={styles.pageButton}
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </section>

      <div
        className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={handleCloseDrawer}
        role="presentation"
      />

      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            {drawerMode === 'create' ? 'Add New Todo' : 'Edit Todo'}
          </h2>
        </div>
        <div className={styles.drawerBody}>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="description">
              Description
            </label>
            <input
              className={styles.formControl}
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What needs to be done?"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dueBy">
              Due By
            </label>
            <input
              className={styles.formControl}
              id="dueBy"
              name="dueBy"
              type="date"
              value={formData.dueBy}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="notes">
              Notes
            </label>
            <textarea
              className={`${styles.formControl} ${styles.formControlTextarea}`}
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any additional notes..."
            />
          </div>
        </div>
        <div className={styles.drawerFooter}>
          <button className={styles.secondaryButton} type="button" onClick={handleCloseDrawer}>
            Cancel
          </button>
          <button className={styles.saveButton} type="button" onClick={handleSaveTodo}>
            {drawerMode === 'create' ? 'Add Todo' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default TodoApp;
