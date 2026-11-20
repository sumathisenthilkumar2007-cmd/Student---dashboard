
const defaultPhoto =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

let students = [];
let uploadedPhoto = defaultPhoto;

// Load saved records
try {
    students = JSON.parse(localStorage.getItem("studentHubData")) || [];
} catch (error) {
    students = [];
}

// Save records
function saveData() {
    try {
        localStorage.setItem("studentHubData", JSON.stringify(students));
        return true;
    } catch (error) {
        alert("Storage is full. Please use a smaller photo.");
        return false;
    }
}

// Escape text
function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Card HTML
function makeCard(student, index) {
    return `
        <article class="student-card" id="card-${index}">
            <div class="id-banner">
                <h3>STUDENT IDENTITY CARD</h3>
                <p>STUDENTHUB</p>
            </div>

            <div class="card-content">
                <img
                    src="${safeText(student.photo || defaultPhoto)}"
                    class="student-photo"
                    alt="Student photo"
                >

                <h3>${safeText(student.name)}</h3>

                <div class="details">
                    <p><strong>Roll No:</strong> ${safeText(student.roll)}</p>
                    <p><strong>Department:</strong> ${safeText(student.dept || "-")}</p>
                    <p><strong>Year:</strong> ${safeText(student.year || "-")}</p>
                    <p><strong>Email:</strong> ${safeText(student.email || "-")}</p>
                </div>

                <div class="id-footer">STUDENT ID</div>
            </div>

            <div class="card-actions">
                <button class="print" data-print="${index}">
                    Print
                </button>
                <button class="remove" data-remove="${index}">
                    Delete
                </button>
            </div>
        </article>
    `;
}

// Render directory
function renderDirectory() {
    const list = document.getElementById("studentList");
    const query = document.getElementById("search").value.toLowerCase().trim();

    list.innerHTML = "";

    const matches = students
        .map((student, index) => ({ student, index }))
        .filter(({ student }) =>
            student.name.toLowerCase().includes(query) ||
            student.roll.toLowerCase().includes(query) ||
            (student.dept || "").toLowerCase().includes(query)
        );

    if (!matches.length) {
        list.innerHTML = `<p class="empty">No students found.</p>`;
        return;
    }

    matches.forEach(({ student, index }) => {
        list.insertAdjacentHTML("beforeend", makeCard(student, index));
    });
}

// Render all ID cards
function renderCards() {
    const list = document.getElementById("cardList");

    list.innerHTML = "";

    if (!students.length) {
        list.innerHTML = `<p class="empty">No ID cards yet.</p>`;
        return;
    }

    students.forEach((student, index) => {
        list.insertAdjacentHTML("beforeend", makeCard(student, index));
    });
}

// Render recent students
function renderRecent() {
    const list = document.getElementById("recent");

    list.innerHTML = "";

    if (!students.length) {
        list.innerHTML = `
            <p class="empty">
                No students registered yet. Add your first student!
            </p>
        `;
        return;
    }

    students.slice(-3).reverse().forEach(student => {
        list.insertAdjacentHTML(
            "beforeend",
            makeCard(student, -1).replace(
                /data-remove="-1"/g,
                'data-remove="disabled"'
            ).replace(
                /data-print="-1"/g,
                'data-print="disabled"'
            )
        );
    });
}

// Update statistics
function updateStats() {
    document.getElementById("countStudents").textContent = students.length;
    document.getElementById("countCards").textContent = students.length;

    const departments = new Set(
        students.map(s => (s.dept || "").trim().toLowerCase()).filter(Boolean)
    );

    document.getElementById("countDepartments").textContent =
        departments.size;
}

// Refresh all screens
function refresh() {
    updateStats();
    renderRecent();
    renderDirectory();
    renderCards();
}

// Navigation
function openPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(page).classList.remove("hidden");

    document.querySelectorAll(".nav").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    const titles = {
        dashboard: ["Dashboard", "Manage your student records"],
        students: ["Students", "Browse and manage students"],
        add: ["Add Student", "Create a student profile"],
        cards: ["ID Cards", "All generated student cards"]
    };

    document.getElementById("heading").textContent = titles[page][0];
    document.getElementById("subheading").textContent = titles[page][1];

    refresh();
}

// Navigation buttons
document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.go));
});

document.getElementById("topAdd").addEventListener("click", () => openPage("add"));
document.getElementById("welcomeAdd").addEventListener("click", () => openPage("add"));

// Search
document.getElementById("search").addEventListener("input", renderDirectory);

// Photo preview
document.getElementById("photo").addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image.");
        this.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Please choose a photo smaller than 2 MB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        uploadedPhoto = event.target.result;

        const preview = document.getElementById("preview");
        preview.src = uploadedPhoto;
        preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
});

// Registration
document.getElementById("form").addEventListener("submit", function (event) {
    event.preventDefault();

    const student = {
        name: document.getElementById("name").value.trim(),
        roll: document.getElementById("roll").value.trim(),
        dept: document.getElementById("dept").value.trim(),
        year: document.getElementById("year").value.trim(),
        email: document.getElementById("email").value.trim(),
        photo: uploadedPhoto
    };

    if (!student.name || !student.roll) {
        alert("Please enter the name and roll number.");
        return;
    }

    const duplicate = students.some(
        s => s.roll.toLowerCase() === student.roll.toLowerCase()
    );

    if (duplicate) {
        alert("This roll number already exists.");
        return;
    }

    students.push(student);

    if (!saveData()) {
        students.pop();
        return;
    }

    resetForm();
    refresh();
    openPage("cards");

    alert("Student card generated successfully!");
});

// Reset form
function resetForm() {
    document.getElementById("form").reset();

    uploadedPhoto = defaultPhoto;

    const preview = document.getElementById("preview");
    preview.src = "";
    preview.classList.add("hidden");
}

document.getElementById("clear").addEventListener("click", resetForm);

// Delete student
function deleteStudent(index) {
    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }

    const previous = [...students];

    students.splice(index, 1);

    if (!saveData()) {
        students = previous;
        return;
    }

    refresh();
}

// Print individual card
function printCard(index) {
    const card = document.getElementById(`card-${index}`);

    if (!card) return;

    card.classList.add("printing");

    window.print();

    card.classList.remove("printing");
}

// Card action events
document.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-remove]");
    const printButton = event.target.closest("[data-print]");

    if (removeButton && removeButton.dataset.remove !== "disabled") {
        deleteStudent(Number(removeButton.dataset.remove));
    }

    if (printButton && printButton.dataset.print !== "disabled") {
        printCard(Number(printButton.dataset.print));
    }
});

// Initial load
refresh();
openPage("dashboard");
