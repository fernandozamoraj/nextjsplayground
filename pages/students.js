import React, { useEffect, useMemo, useState } from 'react';
import BackLink from '../comps/backLink';
import styles from '../styles/Students.module.css';

const mockStudents = [
  {
    id: 1,
    studentId: 'STU-1001',
    firstName: 'Avery',
    lastName: 'Lopez',
    gener: 'Female',
    dob: '2003-02-12',
    email: 'avery.lopez@example.com'
  },
  {
    id: 2,
    studentId: 'STU-1002',
    firstName: 'Mason',
    lastName: 'Clark',
    gener: 'Male',
    dob: '2002-07-05',
    email: 'mason.clark@example.com'
  },
  {
    id: 3,
    studentId: 'STU-1003',
    firstName: 'Sofia',
    lastName: 'Patel',
    gener: 'Female',
    dob: '2004-03-21',
    email: 'sofia.patel@example.com'
  },
  {
    id: 4,
    studentId: 'STU-1004',
    firstName: 'Ethan',
    lastName: 'Nguyen',
    gener: 'Male',
    dob: '2001-11-14',
    email: 'ethan.nguyen@example.com'
  },
  {
    id: 5,
    studentId: 'STU-1005',
    firstName: 'Aria',
    lastName: 'Johnson',
    gener: 'Female',
    dob: '2003-09-30',
    email: 'aria.johnson@example.com'
  },
  {
    id: 6,
    studentId: 'STU-1006',
    firstName: 'Lucas',
    lastName: 'Hernandez',
    gener: 'Male',
    dob: '2002-04-17',
    email: 'lucas.hernandez@example.com'
  },
  {
    id: 7,
    studentId: 'STU-1007',
    firstName: 'Mia',
    lastName: 'Kim',
    gener: 'Female',
    dob: '2004-01-09',
    email: 'mia.kim@example.com'
  },
  {
    id: 8,
    studentId: 'STU-1008',
    firstName: 'Noah',
    lastName: 'Allen',
    gener: 'Male',
    dob: '2001-06-25',
    email: 'noah.allen@example.com'
  },
  {
    id: 9,
    studentId: 'STU-1009',
    firstName: 'Harper',
    lastName: 'Roberts',
    gener: 'Female',
    dob: '2003-12-03',
    email: 'harper.roberts@example.com'
  },
  {
    id: 10,
    studentId: 'STU-1010',
    firstName: 'Logan',
    lastName: 'Walker',
    gener: 'Male',
    dob: '2002-08-19',
    email: 'logan.walker@example.com'
  },
  {
    id: 11,
    studentId: 'STU-1011',
    firstName: 'Isabella',
    lastName: 'Martinez',
    gener: 'Female',
    dob: '2004-05-11',
    email: 'isabella.martinez@example.com'
  },
  {
    id: 12,
    studentId: 'STU-1012',
    firstName: 'Benjamin',
    lastName: 'Hill',
    gener: 'Male',
    dob: '2001-10-27',
    email: 'benjamin.hill@example.com'
  },
  {
    id: 13,
    studentId: 'STU-1013',
    firstName: 'Emma',
    lastName: 'Gonzalez',
    gener: 'Female',
    dob: '2003-03-07',
    email: 'emma.gonzalez@example.com'
  },
  {
    id: 14,
    studentId: 'STU-1014',
    firstName: 'James',
    lastName: 'Russell',
    gener: 'Male',
    dob: '2002-12-15',
    email: 'james.russell@example.com'
  },
  {
    id: 15,
    studentId: 'STU-1015',
    firstName: 'Charlotte',
    lastName: 'Moore',
    gener: 'Female',
    dob: '2001-02-28',
    email: 'charlotte.moore@example.com'
  },
  {
    id: 16,
    studentId: 'STU-1016',
    firstName: 'Elijah',
    lastName: 'Garcia',
    gener: 'Male',
    dob: '2003-07-23',
    email: 'elijah.garcia@example.com'
  },
  {
    id: 17,
    studentId: 'STU-1017',
    firstName: 'Amelia',
    lastName: 'Stewart',
    gener: 'Female',
    dob: '2004-09-04',
    email: 'amelia.stewart@example.com'
  },
  {
    id: 18,
    studentId: 'STU-1018',
    firstName: 'Daniel',
    lastName: 'Carter',
    gener: 'Male',
    dob: '2002-05-29',
    email: 'daniel.carter@example.com'
  },
  {
    id: 19,
    studentId: 'STU-1019',
    firstName: 'Lily',
    lastName: 'Bennett',
    gener: 'Female',
    dob: '2003-01-18',
    email: 'lily.bennett@example.com'
  },
  {
    id: 20,
    studentId: 'STU-1020',
    firstName: 'Owen',
    lastName: 'Reed',
    gener: 'Male',
    dob: '2001-09-08',
    email: 'owen.reed@example.com'
  }
];

const emptyForm = {
  studentId: '',
  firstName: '',
  lastName: '',
  gener: '',
  dob: '',
  email: ''
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [activeId, setActiveId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));

  // Load students from localStorage on mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('studentAppData');
    if (savedStudents) {
      try {
        setStudents(JSON.parse(savedStudents));
      } catch (e) {
        console.error('Error loading students from localStorage:', e);
      }
    }
  }, []);

  // Save students to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('studentAppData', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, currentPage]);

  const handleOpenCreate = () => {
    setDrawerMode('create');
    setActiveId(null);
    setFormData(emptyForm);
    setError('');
    setDrawerOpen(true);
  };

  const handleOpenEdit = (student) => {
    setDrawerMode('edit');
    setActiveId(student.id);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      gener: student.gener,
      dob: student.dob,
      email: student.email
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
    if (!formData.studentId.trim()) return 'Student ID is required.';
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    if (!formData.gener.trim()) return 'Gener is required.';
    if (!formData.dob.trim()) return 'Date of birth is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!formData.email.includes('@')) return 'Email must include @.';
    return '';
  };

  const handleSaveStudent = () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (drawerMode === 'create') {
      const nextId = students.reduce((maxId, student) => Math.max(maxId, student.id), 0) + 1;
      const nextStudents = [
        ...students,
        {
          id: nextId,
          studentId: formData.studentId.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          gener: formData.gener.trim(),
          dob: formData.dob,
          email: formData.email.trim()
        }
      ];
      setStudents(nextStudents);
      setCurrentPage(Math.ceil(nextStudents.length / pageSize));
    } else {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === activeId
            ? {
                ...student,
                studentId: formData.studentId.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                gener: formData.gener.trim(),
                dob: formData.dob,
                email: formData.email.trim()
              }
            : student
        )
      );
    }

    setDrawerOpen(false);
  };

  const paginationButtons = Array.from({ length: totalPages }, (_, index) => index + 1);
  const pageStart = (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, students.length);

  return (
    <div className={styles.page}>
      <BackLink className={styles.backLinkOverride} />
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Student Directory</h1>
            <p className={styles.subtitle}>
              A Demo of managing student records with drawer-based edits and inserts, built with React and Next.js
            </p>
            <p className={styles.subtitle}>
              These are not real students - just randomly generated data for demonstration purposes. The edit and create forms have basic validation to ensure all fields are filled out and the email contains an @ symbol.
            </p>
            <p className={styles.subtitle}>
             There is no backend or database - all data is stored in React state, so any changes will be lost on page refresh. The pagination allows you to navigate through the list of students, showing 10 per page.  
            </p>
            
          </div>
          <button className={styles.primaryButton} type="button" onClick={handleOpenCreate}>
            Create New Student
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.metaText}>
            Showing {pageStart}-{pageEnd} of {students.length} students
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Gener</th>
                <th>Date of Birth</th>
                <th>Email</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudents.map((student, index) => (
                <tr
                  key={student.id}
                  className={styles.rowItem}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <td>{student.studentId}</td>
                  <td>{student.firstName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.gener}</td>
                  <td>{student.dob}</td>
                  <td>{student.email}</td>
                  <td>
                    <button
                      className={styles.editButton}
                      type="button"
                      onClick={() => handleOpenEdit(student)}
                    >
                      Edit
                    </button>
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
            {drawerMode === 'create' ? 'Create New Student' : 'Edit Student'}
          </h2>
        </div>
        <div className={styles.drawerBody}>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="studentId">
              Student ID
            </label>
            <input
              className={styles.formControl}
              id="studentId"
              name="studentId"
              type="text"
              value={formData.studentId}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="firstName">
              First Name
            </label>
            <input
              className={styles.formControl}
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="lastName">
              Last Name
            </label>
            <input
              className={styles.formControl}
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="gener">
              Gener
            </label>
            <select
              className={styles.formControl}
              id="gener"
              name="gener"
              value={formData.gener}
              onChange={handleInputChange}
            >
              <option value="">Select</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Nonbinary">Nonbinary</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="dob">
              Date of Birth
            </label>
            <input
              className={styles.formControl}
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="email">
              Email
            </label>
            <input
              className={styles.formControl}
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className={styles.drawerFooter}>
          <button className={styles.secondaryButton} type="button" onClick={handleCloseDrawer}>
            Cancel
          </button>
          <button className={styles.saveButton} type="button" onClick={handleSaveStudent}>
            {drawerMode === 'create' ? 'Add Student' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Students;
