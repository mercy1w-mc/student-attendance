
/* ==========================================
   GROUP 9: ATTENDANCE CALCULATOR
   Shared JavaScript for four HTML pages
   ========================================== */

const COURSES = [
  "Web Development",
  "Database Systems",
  "Computer Networks",
  "Software Engineering"
];

const DEFAULT_REQUIREMENT = 75;

const STUDENTS = [
  { id: "STU001", name: "Sarah Atim" },
  { id: "STU002", name: "John Okello" },
  { id: "STU003", name: "Grace Auma" },
  { id: "STU004", name: "Peter Draku" },
  { id: "STU005", name: "Mary Adong" },
  { id: "STU006", name: "David Ojara" },
  { id: "STU007", name: "Esther Anyeko" },
  { id: "STU008", name: "Michael Laker" },
  { id: "STU009", name: "Rebecca Abalo" },
  { id: "STU010", name: "Daniel Eton" }
];

const STORAGE_KEY = "group9-attendance-data-v2";

function createInitialData() {
  const enrolments = [];

  STUDENTS.forEach((student, studentIndex) => {
    COURSES.forEach((course, courseIndex) => {
      // Generate realistic but independent sample totals.
      const attended = Math.min(
        10,
        Math.max(
          0,
          5 + ((studentIndex * 3 + courseIndex * 2) % 6)
        )
      );

      enrolments.push({
        id: `${student.id}-${courseIndex + 1}`,
        studentId: student.id,
        studentName: student.name,
        course,
        attended,
        total: 10,
        lastStatus: attended >= 8 ? "Present" :
          attended >= 6 ? "Late" : "Absent",
        participation: "Good"
      });
    });
  });

  return {
    requirement: DEFAULT_REQUIREMENT,
    enrolments,
    sessions: []
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);

      if (
        Number.isFinite(data.requirement) &&
        Array.isArray(data.enrolments) &&
        Array.isArray(data.sessions) &&
        data.enrolments.length === STUDENTS.length * COURSES.length
      ) {
        return data;
      }
    }
  } catch (error) {
    console.error("Could not load saved attendance data:", error);
  }

  const initialData = createInitialData();
  saveData(initialData);
  return initialData;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Could not save attendance data:", error);
    return false;
  }
}

let appData = loadData();

function escapeHTML(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

function getPercentage(enrolment) {
  return enrolment.total > 0
    ? (enrolment.attended / enrolment.total) * 100
    : 0;
}

function isEligible(enrolment) {
  return getPercentage(enrolment) >= appData.requirement;
}

function statusClass(status) {
  return {
    Present: "status-present",
    Late: "status-late",
    Absent: "status-absent"
  }[status] || "";
}

function eligibilityBadge(enrolment) {
  const eligible = isEligible(enrolment);

  return `
    <span class="status-badge ${
      eligible ? "status-eligible" : "status-ineligible"
    }">
      ${eligible ? "Meets requirement" : "Below requirement"}
    </span>
  `;
}

/* ==========================================
   COMMON DROPDOWN OPTIONS
   ========================================== */

function populateCourseDropdowns() {
  document.querySelectorAll("[data-course-options]").forEach(select => {
    const firstOption = select.querySelector("option");
    const placeholder = firstOption
      ? firstOption.outerHTML
      : '<option value="">Select a course</option>';

    select.innerHTML = placeholder;

    COURSES.forEach(course => {
      const option = document.createElement("option");
      option.value = course;
      option.textContent = course;
      select.appendChild(option);
    });
  });
}

function populateStudentDropdown() {
  const studentSelect = document.getElementById("student-select");

  if (!studentSelect) return;

  studentSelect.innerHTML =
    '<option value="">Select a student</option>';

  STUDENTS.forEach(student => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = `${student.id} — ${student.name}`;
    studentSelect.appendChild(option);
  });
}

function updateStudentOptions() {
  const courseSelect = document.getElementById("session-course");
  const studentSelect = document.getElementById("student-select");

  if (!courseSelect || !studentSelect) return;

  const selectedCourse = courseSelect.value;
  const previousStudent = studentSelect.value;

  studentSelect.innerHTML =
    '<option value="">Select an enrolled student</option>';

  if (!selectedCourse) {
    studentSelect.disabled = true;
    return;
  }

  studentSelect.disabled = false;

  const enrolledStudents = appData.enrolments.filter(
    enrolment => enrolment.course === selectedCourse
  );

  enrolledStudents.forEach(enrolment => {
    const option = document.createElement("option");
    option.value = enrolment.studentId;
    option.textContent =
      `${enrolment.studentId} — ${enrolment.studentName}`;
    studentSelect.appendChild(option);
  });

  if (
    enrolledStudents.some(item => item.studentId === previousStudent)
  ) {
    studentSelect.value = previousStudent;
  }
}

/* ==========================================
   PAGE 1: DASHBOARD
   ========================================== */

function renderDashboard() {
  const totalStudents = STUDENTS.length;
  const totalEnrolments = appData.enrolments.length;

  const average = totalEnrolments
    ? appData.enrolments.reduce(
        (sum, item) => sum + getPercentage(item), 0
      ) / totalEnrolments
    : 0;

  const eligible = appData.enrolments.filter(isEligible).length;
  const below = totalEnrolments - eligible;

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  setText("total-students", totalStudents);
  setText("total-enrolments", totalEnrolments);
  setText("average-attendance", `${average.toFixed(1)}%`);
  setText("eligible-students", eligible);
  setText("below-requirement", below);

  const summary = document.getElementById("dashboard-summary");

  if (summary) {
    summary.innerHTML = `
      <p>There are <strong>${totalStudents} students</strong>
      enrolled in <strong>${COURSES.length} courses</strong>,
      making <strong>${totalEnrolments} enrolments</strong>.</p>
      <p>The average attendance across all student-course
      enrolments is <strong>${average.toFixed(1)}%</strong>.</p>
      <p><strong>${eligible}</strong> enrolments meet the
      ${appData.requirement}% attendance requirement, while
      <strong>${below}</strong> are below it.</p>
    `;
  }
}

/* ==========================================
   PAGE 2: ATTENDANCE RECORDS
   ========================================== */

function renderRecords() {
  const body = document.getElementById("attendance-table-body");

  if (!body) return;

  const search = (
    document.getElementById("search-input")?.value || ""
  ).trim().toLowerCase();

  const course = document.getElementById("course-filter")?.value || "";
  const status = document.getElementById("status-filter")?.value || "";

  const filtered = appData.enrolments.filter(item => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(search) ||
      item.studentId.toLowerCase().includes(search) ||
      item.course.toLowerCase().includes(search);

    return matchesSearch &&
      (!course || item.course === course) &&
      (!status || item.lastStatus === status);
  });

  const count = document.getElementById("records-count");

  if (count) {
    count.textContent =
      `Showing ${filtered.length} of ${appData.enrolments.length} enrolments`;
  }

  const message = document.getElementById("records-message");
  if (message) message.textContent = "";

  if (filtered.length === 0) {
    body.innerHTML = `
      <tr><td colspan="7">
        No matching enrolments found. Try changing your search or filters.
      </td></tr>
    `;

    if (message) message.textContent = "No matching records found.";
    return;
  }

  body.innerHTML = filtered.map(item => `
    <tr>
      <td>${escapeHTML(item.studentId)}</td>
      <td><strong>${escapeHTML(item.studentName)}</strong></td>
      <td>${escapeHTML(item.course)}</td>
      <td>${item.attended} / ${item.total}</td>
      <td>${getPercentage(item).toFixed(1)}%</td>
      <td>
        <span class="status-badge ${statusClass(item.lastStatus)}">
          ${escapeHTML(item.lastStatus)}
        </span>
      </td>
      <td>${eligibilityBadge(item)}</td>
    </tr>
  `).join("");
}

/* ==========================================
   PAGE 3: RECORD ATTENDANCE
   ========================================== */

function submitAttendance(event) {
  event.preventDefault();

  const form = document.getElementById("attendance-form");
  const message = document.getElementById("form-message");

  message.textContent = "";
  message.className = "";

  if (!form.checkValidity()) {
    form.reportValidity();
    message.className = "message-error";
    message.textContent = "Please complete all required fields.";
    return;
  }

  const formData = new FormData(form);

  const studentId = formData.get("studentId");
  const course = formData.get("course");
  const date = formData.get("sessionDate");
  const status = formData.get("status");
  const participation = formData.get("participation");

  const enrolment = appData.enrolments.find(item =>
    item.studentId === studentId && item.course === course
  );

  if (!enrolment) {
    message.className = "message-error";
    message.textContent =
      "This student is not enrolled in the selected course.";
    return;
  }

  const duplicate = appData.sessions.some(session =>
    session.studentId === studentId &&
    session.course === course &&
    session.date === date
  );

  if (duplicate) {
    message.className = "message-error";
    message.textContent =
      "Attendance has already been recorded for this student, course, and date.";
    return;
  }

  // Create a copy so a failed save does not change current data.
  const updatedData = JSON.parse(JSON.stringify(appData));
  const target = updatedData.enrolments.find(item =>
    item.studentId === studentId && item.course === course
  );

  target.total += 1;

  if (status === "Present" || status === "Late") {
    target.attended += 1;
  }

  target.lastStatus = status;
  target.participation = participation;

  updatedData.sessions.push({
    studentId,
    studentName: target.studentName,
    course,
    date,
    status,
    participation
  });

  if (!saveData(updatedData)) {
    message.className = "message-error";
    message.textContent =
      "Could not save the record. Check browser storage settings and try again.";
    return;
  }

  appData = updatedData;

  message.className = "message-success";
  message.textContent =
    `Attendance saved for ${target.studentName} in ${course}.`;

  form.reset();
  document.getElementById("student-select").disabled = true;

  const dateInput = document.getElementById("session-date");
  if (dateInput) dateInput.value = getLocalDate();

  updateStudentOptions();
}

function getLocalDate() {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
}

/* ==========================================
   PAGE 4: ATTENDANCE CALCULATOR
   ========================================== */

function renderCalculator() {
  const result = document.getElementById("calculator-result");
  if (!result) return;

  const input = document.getElementById("requirement-input");
  const rawValue = input.value.trim();
  const requirement = Number(rawValue);

  if (
    rawValue === "" ||
    !Number.isFinite(requirement) ||
    requirement < 1 ||
    requirement > 100
  ) {
    result.className = "message-error";
    result.textContent =
      "Enter a minimum attendance requirement between 1% and 100%.";
    return;
  }

  appData.requirement = requirement;

  if (!saveData(appData)) {
    result.className = "message-error";
    result.textContent =
      "The setting could not be saved in browser storage.";
    return;
  }

  const eligible = appData.enrolments.filter(isEligible).length;
  const below = appData.enrolments.length - eligible;

  result.className = "";
  result.innerHTML = `
    <h3>Eligibility results</h3>
    <p>Minimum required attendance:
      <strong>${requirement}%</strong></p>
    <p>Eligible student-course enrolments:
      <strong>${eligible}</strong></p>
    <p>Enrolments below the requirement:
      <strong>${below}</strong></p>
    <p>Each student is assessed separately in every course.</p>
  `;

  renderDashboard();
  renderRecords();
}

/* ==========================================
   START THE CORRECT PAGE
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  populateCourseDropdowns();

  if (document.getElementById("dashboard-summary")) {
    renderDashboard();
  }

  if (document.getElementById("attendance-table-body")) {
    renderRecords();

    document.getElementById("search-input")
      ?.addEventListener("input", renderRecords);

    document.getElementById("course-filter")
      ?.addEventListener("change", renderRecords);

    document.getElementById("status-filter")
      ?.addEventListener("change", renderRecords);
  }

  if (document.getElementById("attendance-form")) {
    populateStudentDropdown();

    const dateInput = document.getElementById("session-date");
    if (dateInput) dateInput.value = getLocalDate();

    document.getElementById("session-course")
      ?.addEventListener("change", updateStudentOptions);

    document.getElementById("attendance-form")
      .addEventListener("submit", submitAttendance);

    updateStudentOptions();
  }

  if (document.getElementById("calculator-result")) {
    const input = document.getElementById("requirement-input");
    input.value = appData.requirement;

    document.getElementById("calculate-button")
      ?.addEventListener("click", renderCalculator);

    input.addEventListener("change", renderCalculator);
  }
});
